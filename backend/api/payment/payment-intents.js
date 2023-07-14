import { prisma, Models } from "../../util/prisma.js";
import { AppError } from "../../util/AppError.js";
import stripe from "../../util/stripe.js";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$get("/payment-intents/:paymentIntentId", getPaymentIntent);
  app.$post("/payment-intents", createPaymentIntent);
  app.$put("/payment-intents/:payment_intent_id/refund", updatePaymentIntent);
}
/**
 * @this {API.This}
 * @param {string} paymentIntentId
 * @returns {Promise<{status: Models.PaymentIntents["status"], amount: Models.PaymentIntents["amount"], PaymentId: Models.PaymentIntents["PaymentId"], type: string}>}
 */
async function getPaymentIntent(paymentIntentId) {
  const paymentIntent = await prisma.paymentIntents.findUnique({
    where: {
      stripeId: paymentIntentId,
    },
    select: {
      status: true,
      amount: true,
      PaymentId: true,
    },
  });

  if (!paymentIntent) throw new AppError(404, "Not found");

  return {
    ...paymentIntent,
    type: paymentIntent.PaymentId ? "payment" : "subscription",
  };
}

/**
 * @this {API.This}
 * @param {Models.Prisma.PaymentsCreateInput & { customerId: number, paymentMethodId: string, priceId: string }} body
 * @returns {Promise<string>}
 */
async function createPaymentIntent(body) {
  const amount = Number(body.amount);
  const customer = await prisma.customers.findUnique({
    where: { id: Number(body.customerId) },
  });

  if (!customer) throw new AppError(404, "Customer not found");

  const stripePaymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "eur",
    payment_method: body.paymentMethodId,
    automatic_payment_methods: { enabled: true },
  });

  if (!stripePaymentIntent) throw new AppError(401, "Unauthorized");

  const payment = await prisma.payments.create({
    data: {
      amount: amount / 100,
      CustomerId: customer.id,
      // TODO: allow config for multiple users
      UserId: 1,
      billingAddress: body.billingAddress,
      billingZipCode: body.billingZipCode,
      billingCity: body.billingCity,
      billingCountry: body.billingCountry,
      stripePriceId: body.priceId,
    },
  });

  await prisma.paymentIntents.create({
    data: {
      amount: amount / 100,
      stripeId: stripePaymentIntent?.id,
      PaymentId: payment.id,
    },
  });

  return stripePaymentIntent.client_secret;
}

/**
 *
 * @param {string} paymentIntentId
 * @param {{amount: number}} body
 * @returns {Promise<Models.Payments>}
 */
async function updatePaymentIntent(paymentIntentId, body) {
  const paymentIntent = await prisma.paymentIntents.findUnique({
    where: {
      id: Number(paymentIntentId),
    },
  });

  let payment;
  if (paymentIntent?.stripeId && paymentIntent?.PaymentId) {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntent?.stripeId,
      ...(body.amount && { amount: Number(body.amount) }),
    });

    await stripe.paymentIntents.cancel(paymentIntent?.stripeId);
    payment = await prisma.payments.update({
      where: {
        id: paymentIntent.PaymentId,
      },
      data: {
        status: "REFUNDED",
        stripeRefundId: refund?.id,
      },
    });
  }

  return payment;
}
