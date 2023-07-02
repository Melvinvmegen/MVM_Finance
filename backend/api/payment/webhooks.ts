import express, { Request, Response, NextFunction } from "express";
import { prisma } from "../../util/prisma.js";
import stripe from "../../util/stripe.js";
import { AppError } from "../../util/AppError.js";
import { settings } from "../../util/settings.js";
import axios from "axios";

const router = express.Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  let event;

  try {
    if (!req.headers["stripe-signature"]) return next(new AppError(400, "Unauthorized"));
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], settings.stripe.webhookSecret);
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.` + err);
    return res.sendStatus(400);
  }
  const object = event?.data?.object;
  let customer;
  // @ts-ignore
  if (object?.customer) {
    customer = await prisma.customers.findFirst({
      where: {
        // @ts-ignore
        stripeId: object?.customer,
      },
    });
  }

  switch (event?.type) {
    case "payment_intent.succeeded":
      try {
        console.log("Handling payment_intent.succeeded event...", object);
        const { PaymentId } = await prisma.paymentIntents.update({
          where: {
            // @ts-ignore
            stripeId: object?.id,
          },
          data: {
            status: "CAPTURED",
          },
        });

        if (PaymentId) {
          const payment = await prisma.payments.update({
            where: {
              id: PaymentId,
            },
            data: {
              status: "CAPTURED",
            },
          });

          if (!payment.stripePriceId) throw new AppError(404, "Not found");
          const price = await stripe.prices.retrieve(payment.stripePriceId);

          if (payment?.CustomerId && price.nickname) {
            await sendWebhook({
              customerId: payment?.CustomerId,
              tokens: price.nickname?.split(" tokens")?.[0],
            });
          }
        }
      } catch (error) {
        console.log("error", error);
        return next(new AppError(500, "Stripe webhook payment_intent.succeeded failed"));
      }
      break;
    case "payment_intent.payment_failed":
      console.log("Handling payment_intent.payment_failed event...", object);
      const { id, PaymentId, ...paymentIntent } = await prisma.paymentIntents.update({
        where: {
          // @ts-ignore
          stripeId: object.id,
        },
        data: {
          status: "FAILED",
        },
      });

      if (PaymentId) {
        await prisma.payments.update({
          where: {
            id: PaymentId,
          },
          data: {
            status: "FAILED",
            paymentTries: { increment: 1 },
          },
        });
      }
      try {
      } catch (error) {
        console.log("error", error);
        return next(new AppError(500, "Stripe webhook payment_intent.payment_failed failed"));
      }
      break;
    case "invoice.paid":
      try {
        if (!customer || !customer.stripeId) return res.sendStatus(404);
        console.log("Handling invoice.paid event...", object);
        const subscription = await prisma.subscriptions.findFirst({
          where: {
            CustomerId: customer.id,
          },
        });

        if (!subscription) return res.sendStatus(404);

        const paymentIntent = await prisma.paymentIntents.findUnique({
          where: {
            // @ts-ignore
            stripeId: object.payment_intent,
          },
        });

        if (paymentIntent) {
          await prisma.paymentIntents.update({
            where: {
              // @ts-ignore
              stripeId: object.payment_intent,
            },
            data: {
              status: "CAPTURED",
              // @ts-ignore
              SubscriptionId: subscription.id,
              // @ts-ignore
              amount: object.amount_due / 100,
            },
          });
        } else {
          await prisma.paymentIntents.create({
            data: {
              status: "CAPTURED",
              // @ts-ignore
              stripeId: object.payment_intent,
              SubscriptionId: subscription.id,
              // @ts-ignore
              amount: object.amount_due / 100,
            },
          });
        }
        await prisma.subscriptions.update({
          where: {
            id: subscription.id,
          },
          data: {
            status: "VALIDATED",
            startDate: subscription.startDate || new Date(),
            // @ts-ignore
            amount: object.amount_due / 100,
          },
        });

        // TODO : set paid invoice
        await sendWebhook({
          customerId: customer.id,
          subscriptionId: subscription.id,
        });
      } catch (error) {
        console.log("error", error);
        return next(new AppError(500, "Stripe webhook invoice.paid failed"));
      }
      break;
    case "invoice.payment_failed":
      try {
        if (!customer || !customer.stripeId) return res.sendStatus(404);
        console.log("Handling invoice.payment_failed event...", object);
        const subscription = await prisma.subscriptions.findUnique({
          where: {
            CustomerId: customer.id,
          },
        });
        if (!subscription) return res.sendStatus(404);
        await prisma.subscriptions.update({
          where: {
            id: subscription.id,
          },
          data: {
            status: "FAILED",
            endDate: new Date(),
          },
        });

        const paymentIntent = await prisma.paymentIntents.findUnique({
          where: {
            // @ts-ignore
            stripeId: object.payment_intent,
          },
        });

        if (paymentIntent) {
          await prisma.paymentIntents.update({
            where: {
              // @ts-ignore
              stripeId: object.payment_intent,
            },
            data: {
              status: "FAILED",
              // @ts-ignore
              SubscriptionId: subscription.id,
              // @ts-ignore
              amount: object.amount_due / 100,
            },
          });
        } else {
          await prisma.paymentIntents.create({
            data: {
              status: "FAILED",
              // @ts-ignore
              stripeId: object.payment_intent,
              SubscriptionId: subscription.id,
              // @ts-ignore
              amount: object.amount_due / 100,
            },
          });
        }

        await stripe.subscriptions.del(subscription.stripeId);

        await sendWebhook({
          customerId: customer.id,
          subscriptionId: null,
        });
        // TODO : set failed invoice
      } catch (error) {
        console.log("error", error);
        return next(new AppError(500, "Stripe webhook invoice.payment_failed failed"));
      }
      break;
    case "invoice.finalized":
      try {
        if (!customer || !customer.stripeId) return res.sendStatus(404);
        console.log("Handling invoice.finalized event...", object);
        // TODO : create Invoices
      } catch (error) {
        console.log("error", error);
        return next(new AppError(500, "Stripe webhook invoice.finalized failed"));
      }
      break;
    default:
      // Unexpected event type
      console.log("Unhandled event type", event?.type);
      return next(new AppError(200, "Unhandled event type"));
  }
  res.sendStatus(200);
});

async function sendWebhook(object: { customerId: number; tokens?: string; subscriptionId?: number | null }) {
  // @ts-ignore
  await axios.post(settings.webhooks.contentUrl, object, {
    headers: {
      "content-type": "text/json",
      Authorization: `Basic ${Buffer.from(
        `${settings.webhooks.contentUser}:${settings.webhooks.contentPassword}`
      ).toString("base64")}`,
    },
  });

  return;
}

export default router;
