/* eslint-disable no-console */
import { prisma } from "../../util/prisma.js";
import stripe from "../../util/stripe.js";
import { AppError } from "../../util/AppError.js";
import { settings } from "../../util/settings.js";
import axios from "axios";

async function routes(app, options) {
  app.post("/webhooks", async (request, reply) => {
    let event;

    try {
      if (!request.headers["stripe-signature"]) throw new AppError(400, "Unauthorized");
      event = stripe.webhooks.constructEvent(
        request.body,
        request.headers["stripe-signature"],
        settings.stripe.webhookSecret
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.` + err);
      // TODO: check this
      return reply.sendStatus(400);
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
          throw new AppError(500, "Stripe webhook payment_intent.succeeded failed");
        }
        break;
      case "payment_intent.payment_failed":
        try {
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
        } catch (error) {
          console.log("error", error);
          throw new AppError(500, "Stripe webhook payment_intent.succeeded failed");
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
          throw new AppError(500, "Stripe webhook payment_intent.succeeded failed");
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
          throw new AppError(500, "Stripe webhook payment_intent.succeeded failed");
        }
        break;
      case "invoice.finalized":
        try {
          if (!customer || !customer.stripeId) return reply.sendStatus(404);
          console.log("Handling invoice.finalized event...", object);
          // TODO : create Invoices
        } catch (error) {
          console.log("error", error);
          throw new AppError(500, "Stripe webhook payment_intent.succeeded failed");
        }
        break;
      default:
        console.log("Unhandled event type", event?.type);
        throw new AppError(500, "Stripe webhook payment_intent.succeeded failed");
    }
    // TODO: check this
    reply.sendStatus(200);
  });
}

async function sendWebhook(object) {
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

export default routes;
