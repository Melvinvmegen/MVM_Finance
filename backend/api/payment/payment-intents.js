import express from "express";
import { prisma } from "../../util/prisma.js";
import { AppError } from "../../util/AppError.js";
import stripe from "../../util/stripe.js";

const router = express.Router();

router.get("/:paymentIntentId", async (req, res, next) => {
  try {
    const paymentIntent = await prisma.paymentIntents.findUnique({
      where: {
        stripeId: req.params.paymentIntentId,
      },
      select: {
        status: true,
        amount: true,
        PaymentId: true,
      },
    });

    if (!paymentIntent) throw new AppError(404, "Not found");

    res.json({
      ...paymentIntent,
      type: paymentIntent.PaymentId ? "payment" : "subscription",
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  const amount = Number(req.body.amount);
  const customer = await prisma.customers.findUnique({
    where: { id: req.body.customerId },
  });

  if (!customer) throw new AppError(404, "Customer not found");

  const stripePaymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "eur",
    payment_method: req.body.paymentMethodId,
    automatic_payment_methods: { enabled: true },
  });

  if (!stripePaymentIntent) throw new AppError(401, "Unauthorized");

  const payment = await prisma.payments.create({
    data: {
      amount: amount / 100,
      CustomerId: customer.id,
      // TODO: allow config for multiple users
      UserId: 1,
      billingAddress: req.body.billingAddress,
      billingZipCode: req.body.billingZipCode,
      billingCity: req.body.billingCity,
      billingCountry: req.body.billingCountry,
      stripePriceId: req.body.priceId,
    },
  });

  await prisma.paymentIntents.create({
    data: {
      amount: amount / 100,
      stripeId: stripePaymentIntent?.id,
      PaymentId: payment.id,
    },
  });

  res.send(stripePaymentIntent.client_secret);
});

router.put("/payment-intents/:payment_intent_id/refund", async (req, res, next) => {
  try {
    const paymentIntent = await prisma.paymentIntents.findUnique({
      where: {
        id: Number(req.params.payment_intent_id),
      },
    });

    let refund;
    if (paymentIntent?.stripeId && paymentIntent?.PaymentId) {
      refund = await stripe.refunds.create({
        payment_intent: paymentIntent?.stripeId,
        ...(req.body.amount && { amount: req.body.amount }),
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
  } catch (error) {
    console.log("Refund failed:", error);
    throw new AppError(401, "Unauthorized");
  }
});

export default router;
