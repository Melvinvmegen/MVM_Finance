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
      customer = await prisma.customer.findFirst({
        where: {
          // @ts-ignore
          stripe_id: object?.customer,
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
          const payment_intent = await prisma.payment_intent.findUnique({
            where: {
              stripe_id: objectId,
            },
          });

          if (!payment_intent) throw new AppError("PaymentIntent Not found");

          const { payment_id } = await prisma.payment_intent.update({
            where: {
              stripe_id: objectId,
            },
            data: {
              status: "CAPTURED",
            },
          });

          if (!payment_id) throw new AppError("PaymentId Not found");

          let payment = await prisma.payment.findUnique({
            where: {
              id: payment_id,
            },
          });

          if (!payment.stripe_price_id || !payment.customer_id) throw new AppError("Payment not found");

          payment = await prisma.payment.update({
            where: {
              id: payment_id,
            },
            data: {
              status: "CAPTURED",
            },
          });

          const price = await stripe.prices.retrieve(payment.stripe_price_id);

          if (payment?.customer_id && price.nickname) {
            await sendWebhook({
              customer_id: payment?.customer_id,
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
          let payment_intent = await prisma.payment_intent.findUnique({
            where: {
              stripe_id: objectId,
            },
          });

          if (!payment_intent) throw new AppError("payment_intent Not found");

          payment_intent = await prisma.payment_intent.update({
            where: {
              stripe_id: objectId,
            },
            data: {
              status: "FAILED",
            },
          });

          if (!payment_intent.payment_id) throw new AppError("PaymentId Not found");

          await prisma.payment.update({
            where: {
              id: payment_intent.payment_id,
            },
            data: {
              status: "FAILED",
              payment_tries: { increment: 1 },
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
          if (!customer || !customer.stripe_id) throw new AppError("Missing informations");
          // @ts-ignore
          const objectPaymentIntent = object.payment_intent;
          console.log("[Stripe] Handling invoice.paid event...", objectPaymentIntent);
          const subscription = await prisma.subscription.findFirst({
            where: {
              customer_id: customer.id,
            },
          });

          if (!subscription) throw new AppError("Subscription Not found");

          // @ts-ignore
          const objectAmountDue = object.amount_due;
          const payment_intent = await prisma.payment_intent.findUnique({
            where: {
              stripe_id: objectPaymentIntent,
            },
          });

          if (payment_intent) {
            await prisma.payment_intent.update({
              where: {
                stripe_id: objectPaymentIntent,
              },
              data: {
                status: "CAPTURED",
                subscription_id: subscription.id,
                amount: objectAmountDue / 100,
              },
            });
          } else {
            await prisma.payment_intent.create({
              data: {
                status: "CAPTURED",
                stripe_id: objectPaymentIntent,
                subscription_id: subscription.id,
                amount: objectAmountDue / 100,
              },
            });
          }

          await prisma.subscription.update({
            where: {
              id: subscription.id,
            },
            data: {
              status: "VALIDATED",
              start_date: subscription.start_date || dayjs().toDate(),
              amount: objectAmountDue / 100,
            },
          });

          // TODO : set paid invoice
          await sendWebhook({
            customer_id: customer.id,
            subscription_id: subscription.id,
          });

          console.log("[Stripe] invoice.paid successfully handled for", objectPaymentIntent);
        } catch (error) {
          console.log("error", error);
          throw new AppError(500, "[Stripe] invoice.paid failed");
        }
        break;
      case "invoice.payment_failed":
        try {
          if (!customer || !customer.stripe_id) throw new AppError("Missing informations");
          // @ts-ignore
          const objectPaymentIntent = object.payment_intent;
          console.log("[Stripe] Handling invoice.payment_failed event...", objectPaymentIntent);
          const subscription = await prisma.subscription.findUnique({
            where: {
              customer_id: customer.id,
            },
          });

          if (!subscription) throw new AppError("Subscription Not found");

          await prisma.subscription.update({
            where: {
              id: subscription.id,
            },
            data: {
              status: "FAILED",
              end_date: dayjs().toDate(),
            },
          });

          // @ts-ignore
          const objectAmountDue = object.amount_due;
          const payment_intent = await prisma.payment_intent.findUnique({
            where: {
              stripe_id: objectPaymentIntent,
            },
          });

          if (payment_intent) {
            await prisma.payment_intent.update({
              where: {
                stripe_id: objectPaymentIntent,
              },
              data: {
                status: "FAILED",
                subscription_id: subscription.id,
                amount: objectAmountDue / 100,
              },
            });
          } else {
            await prisma.payment_intent.create({
              data: {
                status: "FAILED",
                stripe_id: objectPaymentIntent,
                subscription_id: subscription.id,
                amount: objectAmountDue / 100,
              },
            });
          }

          await stripe.subscriptions.del(subscription.stripe_id);

          await sendWebhook({
            customer_id: customer.id,
            subscription_id: null,
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
          if (!customer || !customer.stripe_id) throw new AppError("Missing informations");
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
