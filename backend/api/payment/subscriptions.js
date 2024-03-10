import { Models, prisma } from "../../utils/prisma.js";
import { AppError } from "../../utils/AppError.js";
import stripe from "../../utils/stripe.js";
import dayjs from "dayjs";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$post("/subscriptions", createSubscription);
  app.$get("/subscriptions/:subscription_id", getSubscription);
  app.$put("/subscriptions/:subscription_id/refund", refundSubscription);
}

/**
 * @this {API.This}
 * @param {{customer_id: string, payment_method_id: string, price_id: string}} body
 * @returns {Promise<string>}
 */
async function createSubscription(body) {
  const { customer_id, payment_method_id, price_id } = body;
  const number_customer_id = Number(customer_id);

  let stripeSubscription;
  const customer = await prisma.customer.findUnique({
    where: {
      id: number_customer_id,
    },
  });

  if (!customer || !customer.stripe_id) throw new AppError("Customer not found");

  const stripePrice = await stripe.prices.retrieve(price_id);
  if (stripePrice && stripePrice.unit_amount) {
    stripeSubscription = await stripe.subscriptions.create({
      customer: customer.stripe_id,
      items: [
        {
          price: stripePrice.id,
        },
      ],
      payment_behavior: "default_incomplete",
      proration_behavior: "none",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.payment_intent"],
    });

    const stripePaymentIntent = await stripe.paymentIntents.update(
      // @ts-ignore
      stripeSubscription?.latest_invoice?.payment_intent?.id,
      { metadata: { payment_method: payment_method_id } }
    );
    const amount = stripePrice.unit_amount / 100;

    let subscription = await prisma.subscription.findUnique({
      where: {
        customer_id: number_customer_id,
      },
    });

    if (subscription) {
      subscription = await prisma.subscription.update({
        where: {
          customer_id: number_customer_id,
        },
        data: {
          status: "DRAFT",
          amount,
          stripe_id: stripeSubscription.id,
        },
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          status: "DRAFT",
          amount,
          start_date: null,
          end_date: null,
          customer_id: number_customer_id,
          stripe_id: stripeSubscription.id,
        },
      });
    }

    await prisma.payment_intent.create({
      data: {
        amount,
        stripe_id: stripePaymentIntent?.id,
        subscription_id: subscription.id,
      },
    });

    // TODO: check this works
    return stripePaymentIntent?.client_secret;
  }
}

/**
 * @this {API.This}
 * @param {string} subscription_id
 * @returns {Promise<Models.subscription>}
 */
async function refundSubscription(subscription_id) {
  const number_subscription_id = Number(subscription_id);
  const subscription = await prisma.subscription.findFirst({
    where: {
      id: number_subscription_id,
      status: "VALIDATED",
    },
    include: {
      payment_intents: {
        orderBy: {
          created_at: "desc",
        },
      },
    },
  });

  if (!subscription || !subscription.stripe_id) throw new AppError("Subscription not found");

  const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_id);
  if (stripeSubscription?.id) {
    const startDate = dayjs.unix(stripeSubscription.current_period_start);
    const endDate = dayjs.unix(stripeSubscription.current_period_end);
    const totalMinutes = Math.ceil(endDate.diff(startDate, "minute"));
    const unusedMinutes = Math.ceil(endDate.diff(dayjs(), "minute"));
    const refundPercentage = unusedMinutes / totalMinutes;
    const refundAmount = Math.round(refundPercentage * (stripeSubscription.items.data[0].price.unit_amount || 0));

    const stripePaymentIntentId = subscription.payment_intents[0].stripe_id;
    let refund;
    if (refundAmount && stripePaymentIntentId) {
      refund = await stripe.refunds.create({
        amount: refundAmount,
        payment_intent: stripePaymentIntentId,
      });
    }
    await stripe.subscriptions.del(subscription.stripe_id);

    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: number_subscription_id,
      },
      data: {
        status: "CANCELLED",
        end_date: dayjs().toDate(),
        prorated_amount: refundAmount / 100,
        refund_id: refund?.id,
      },
    });

    return updatedSubscription;
  }
}

/**
 * @this {API.This}
 * @param {string} subscription_id
 * @returns {Promise<Models.subscription>}
 */
async function getSubscription(subscription_id) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      id: Number(subscription_id),
    },
  });

  if (!subscription) throw new AppError("Not found");

  return {
    ...subscription,
    stripe_id: null,
  };
}
