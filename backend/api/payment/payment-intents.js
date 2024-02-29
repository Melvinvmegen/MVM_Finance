import { prisma, Models } from "../../utils/prisma.js";
import { AppError } from "../../utils/AppError.js";
import stripe from "../../utils/stripe.js";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$get("/payment-intents/:payment_intent_id", getPaymentIntent);
  app.$post("/payment-intents", createPaymentIntent);
  app.$put("/payment-intents/:payment_intent_id/refund", updatePaymentIntent);
}
/**
 * @this {API.This}
 * @param {string} payment_intent_id
 * @returns {Promise<{status: Models.payment_intent["status"], amount: Models.payment_intent["amount"], payment_id: Models.payment_intent["payment_id"], type: string}>}
 */
async function getPaymentIntent(payment_intent_id) {
  const paymentIntent = await prisma.payment_intent.findUnique({
    where: {
      stripe_id: payment_intent_id,
    },
    select: {
      status: true,
      amount: true,
      payment_id: true,
    },
  });

  if (!paymentIntent) throw new AppError("Not found");

  return {
    ...paymentIntent,
    type: paymentIntent.payment_id ? "payment" : "subscription",
  };
}

/**
 * @this {API.This}
 * @param {Models.Prisma.paymentCreateInput & { customer_id: number, payment_method_id: string, price_id: string }} body
 * @returns {Promise<string>}
 */
async function createPaymentIntent(body) {
  const amount = Number(body.amount);
  const customer = await prisma.customer.findUnique({
    where: { id: Number(body.customer_id) },
  });

  if (!customer) throw new AppError("Customer not found");

  const stripePaymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "eur",
    payment_method: body.payment_method_id,
    automatic_payment_methods: { enabled: true },
  });

  if (!stripePaymentIntent) throw new AppError(401, "Unauthorized");

  const payment = await prisma.payment.create({
    data: {
      amount: amount / 100,
      customer_id: customer.id,
      // TODO: allow config for multiple users
      user_id: 1,
      billing_address: body.billing_address,
      billing_zip_code: body.billing_zip_code,
      billing_city: body.billing_city,
      billing_country: body.billing_country,
      stripe_price_id: body.price_id,
    },
  });

  await prisma.payment_intent.create({
    data: {
      amount: amount / 100,
      stripe_id: stripePaymentIntent?.id,
      payment_id: payment.id,
    },
  });

  return stripePaymentIntent.client_secret;
}

/**
 *
 * @param {string} payment_intent_id
 * @param {{amount: number}} body
 * @returns {Promise<Models.payment>}
 */
async function updatePaymentIntent(payment_intent_id, body) {
  const paymentIntent = await prisma.payment_intent.findUnique({
    where: {
      id: Number(payment_intent_id),
    },
  });

  let payment;
  if (paymentIntent?.stripe_id && paymentIntent?.payment_id) {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntent?.stripe_id,
      ...(body.amount && { amount: Number(body.amount) }),
    });

    await stripe.paymentIntents.cancel(paymentIntent?.stripe_id);
    payment = await prisma.payment.update({
      where: {
        id: paymentIntent.payment_id,
      },
      data: {
        status: "REFUNDED",
        stripe_refund_id: refund?.id,
      },
    });
  }

  return payment;
}
