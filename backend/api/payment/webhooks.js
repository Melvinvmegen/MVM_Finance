/* eslint-disable no-console */
import UnauthorizedError from "../../utils/unauthorizedError.js";
import { AppError } from "../../utils/AppError.js";
import { settings } from "../../utils/settings.js";
import { prisma } from "../../utils/prisma.js";
import stripe from "../../utils/stripe.js";
import { ofetch } from "ofetch";
import dayjs from "dayjs";

/**
 * @param {API.ServerInstance} app
 */
async function routes(app) {
  app.post("/webhooks", async (request, reply) => {
    let event;
    try {
      if (!request.headers["stripe-signature"]) throw new AppError("Unauthorized");
      event = stripe.webhooks.constructEvent(
        request.rawBody,
        request.headers["stripe-signature"],
        settings.stripe.webhookSecret
      );
    } catch (err) {
      console.log("[Stripe] ⚠️ signature verification failed." + err);
      throw new UnauthorizedError("errors.server.unauthorized");
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

      if (!customer) throw new AppError("[Stripe] Customer Not found");
    }

    switch (event?.type) {
      case "payment_intent.succeeded":
        try {
          // @ts-ignore
          const objectId = object?.id;
          console.log("[Stripe] Handling payment_intent.succeeded event...", objectId);
          const paymentIntent = await prisma.paymentIntents.findUnique({
            where: {
              stripeId: objectId,
            },
          });

          if (!paymentIntent) throw new AppError("PaymentIntent Not found");

          const { PaymentId } = await prisma.paymentIntents.update({
            where: {
              stripeId: objectId,
            },
            data: {
              status: "CAPTURED",
            },
          });

          if (!PaymentId) throw new AppError("PaymentId Not found");

          let payment = await prisma.payments.findUnique({
            where: {
              id: PaymentId,
            },
          });

          if (!payment.stripePriceId || !payment.CustomerId) throw new AppError("Payment not found");

          payment = await prisma.payments.update({
            where: {
              id: PaymentId,
            },
            data: {
              status: "CAPTURED",
            },
          });

          const price = await stripe.prices.retrieve(payment.stripePriceId);

          console.log("payment?.CustomerId", payment?.CustomerId);
          console.log("price.nickname", price);
          if (payment?.CustomerId && price.nickname) {
            await sendWebhook({
              customerId: payment?.CustomerId,
              tokens: price.nickname?.split(" tokens")?.[0],
            });
          }

          console.log("[Stripe] payment_intent.succeeded successfully handled for", objectId);
        } catch (error) {
          console.log("error", error);
          throw new AppError(500, "[Stripe] payment_intent.succeeded failed");
        }
        break;
      case "payment_intent.payment_failed":
        try {
          // @ts-ignore
          const objectId = object?.id;
          console.log("[Stripe] Handling payment_intent.payment_failed event...", objectId);
          let paymentIntent = await prisma.paymentIntents.findUnique({
            where: {
              stripeId: objectId,
            },
          });

          if (!paymentIntent) throw new AppError("paymentIntent Not found");

          paymentIntent = await prisma.paymentIntents.update({
            where: {
              stripeId: objectId,
            },
            data: {
              status: "FAILED",
            },
          });

          if (!paymentIntent.PaymentId) throw new AppError("PaymentId Not found");

          await prisma.payments.update({
            where: {
              id: paymentIntent.PaymentId,
            },
            data: {
              status: "FAILED",
              paymentTries: { increment: 1 },
            },
          });

          console.log("[Stripe] payment_intent.payment_failed successfully handled for", objectId);
        } catch (error) {
          console.log("error", error);
          throw new AppError(500, "[Stripe] payment_intent.payment_failed failed");
        }
        break;
      case "invoice.paid":
        try {
          if (!customer || !customer.stripeId) throw new AppError("Missing informations");
          // @ts-ignore
          const objectPaymentIntent = object.payment_intent;
          console.log("[Stripe] Handling invoice.paid event...", objectPaymentIntent);
          const subscription = await prisma.subscriptions.findFirst({
            where: {
              CustomerId: customer.id,
            },
          });

          if (!subscription) throw new AppError("Subscription Not found");

          // @ts-ignore
          const objectAmountDue = object.amount_due;
          const paymentIntent = await prisma.paymentIntents.findUnique({
            where: {
              stripeId: objectPaymentIntent,
            },
          });

          if (paymentIntent) {
            await prisma.paymentIntents.update({
              where: {
                stripeId: objectPaymentIntent,
              },
              data: {
                status: "CAPTURED",
                SubscriptionId: subscription.id,
                amount: objectAmountDue / 100,
              },
            });
          } else {
            await prisma.paymentIntents.create({
              data: {
                status: "CAPTURED",
                stripeId: objectPaymentIntent,
                SubscriptionId: subscription.id,
                amount: objectAmountDue / 100,
              },
            });
          }

          await prisma.subscriptions.update({
            where: {
              id: subscription.id,
            },
            data: {
              status: "VALIDATED",
              startDate: subscription.startDate || dayjs().toDate(),
              amount: objectAmountDue / 100,
            },
          });

          // TODO : set paid invoice
          await sendWebhook({
            customerId: customer.id,
            subscriptionId: subscription.id,
          });

          console.log("[Stripe] invoice.paid successfully handled for", objectPaymentIntent);
        } catch (error) {
          console.log("error", error);
          throw new AppError(500, "[Stripe] invoice.paid failed");
        }
        break;
      case "invoice.payment_failed":
        try {
          if (!customer || !customer.stripeId) throw new AppError("Missing informations");
          // @ts-ignore
          const objectPaymentIntent = object.payment_intent;
          console.log("[Stripe] Handling invoice.payment_failed event...", objectPaymentIntent);
          const subscription = await prisma.subscriptions.findUnique({
            where: {
              CustomerId: customer.id,
            },
          });

          if (!subscription) throw new AppError("Subscription Not found");

          await prisma.subscriptions.update({
            where: {
              id: subscription.id,
            },
            data: {
              status: "FAILED",
              endDate: dayjs().toDate(),
            },
          });

          // @ts-ignore
          const objectAmountDue = object.amount_due;
          const paymentIntent = await prisma.paymentIntents.findUnique({
            where: {
              stripeId: objectPaymentIntent,
            },
          });

          if (paymentIntent) {
            await prisma.paymentIntents.update({
              where: {
                stripeId: objectPaymentIntent,
              },
              data: {
                status: "FAILED",
                SubscriptionId: subscription.id,
                amount: objectAmountDue / 100,
              },
            });
          } else {
            await prisma.paymentIntents.create({
              data: {
                status: "FAILED",
                stripeId: objectPaymentIntent,
                SubscriptionId: subscription.id,
                amount: objectAmountDue / 100,
              },
            });
          }

          await stripe.subscriptions.del(subscription.stripeId);

          await sendWebhook({
            customerId: customer.id,
            subscriptionId: null,
          });

          // TODO : set failed invoice
          console.log("[Stripe] invoice.payment_failed successfully handled for", objectPaymentIntent);
        } catch (error) {
          console.log("error", error);
          throw new AppError(500, "invoice.payment_failed failed");
        }
        break;
      case "invoice.finalized":
        try {
          if (!customer || !customer.stripeId) throw new AppError("Missing informations");
          console.log("[Stripe] Handling invoice.finalized event...", object.id);
          // TODO : create Invoices
        } catch (error) {
          console.log("error", error);
          throw new AppError(500, "Stripe webhook invoice.finalized failed");
        }
        break;
      default:
        console.log("[Stripe] Unhandled event type", event?.type);
        throw new AppError(500, `Stripe webhook ${event?.type} failed`);
    }
    reply.status(200).send();
  });
}

async function sendWebhook(body) {
  console.log(`[Stripe] Sending webhook to ${settings.webhooks.contentUrl}`);
  // TODO: says 404 but works
  await ofetch(settings.webhooks.contentUrl, {
    method: "POST",
    headers: {
      "content-type": "text/json",
      Authorization: `Basic ${Buffer.from(
        `${settings.webhooks.contentUser}:${settings.webhooks.contentPassword}`
      ).toString("base64")}`,
    },
    body,
  });
  console.log(`[Stripe] Webhook successfully sent to ${settings.webhooks.contentUrl}`);
}

export default routes;
