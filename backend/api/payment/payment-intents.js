import { prisma } from "../../util/prisma.js";
import { AppError } from "../../util/AppError.js";
import stripe from "../../util/stripe.js";

async function routes(app, options) {
  app.get("/payment-intents/:paymentIntentId", async (request, reply) => {
    const paymentIntent = await prisma.paymentIntents.findUnique({
      where: {
        stripeId: request.params.paymentIntentId,
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
  });

  app.post("/payment-intents", async (request, reply) => {
    const amount = Number(request.body.amount);
    const customer = await prisma.customers.findUnique({
      where: { id: request.body.customerId },
    });

    if (!customer) throw new AppError(404, "Customer not found");

    const stripePaymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      payment_method: request.body.paymentMethodId,
      automatic_payment_methods: { enabled: true },
    });

    if (!stripePaymentIntent) throw new AppError(401, "Unauthorized");

    const payment = await prisma.payments.create({
      data: {
        amount: amount / 100,
        CustomerId: customer.id,
        // TODO: allow config for multiple users
        UserId: 1,
        billingAddress: request.body.billingAddress,
        billingZipCode: request.body.billingZipCode,
        billingCity: request.body.billingCity,
        billingCountry: request.body.billingCountry,
        stripePriceId: request.body.priceId,
      },
    });

    await prisma.paymentIntents.create({
      data: {
        amount: amount / 100,
        stripeId: stripePaymentIntent?.id,
        PaymentId: payment.id,
      },
    });

    // TODO: check this works
    reply.send(stripePaymentIntent.client_secret);
  });

  app.put("/payment-intents/:payment_intent_id/refund", async (request, reply) => {
    const paymentIntent = await prisma.paymentIntents.findUnique({
      where: {
        id: Number(request.params.payment_intent_id),
      },
    });

    let refund;
    if (paymentIntent?.stripeId && paymentIntent?.PaymentId) {
      refund = await stripe.refunds.create({
        payment_intent: paymentIntent?.stripeId,
        ...(request.body.amount && { amount: request.body.amount }),
      });

      await stripe.paymentIntents.cancel(paymentIntent?.stripeId);
      await prisma.payments.update({
        where: {
          id: paymentIntent.PaymentId,
        },
        data: {
          status: "REFUNDED",
          stripeRefundId: refund?.id,
        },
      });
    }

    // TODO: are we supposed to return something?
    return;
  });
}

export default routes;
