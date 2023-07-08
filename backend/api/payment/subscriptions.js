import { prisma } from "../../util/prisma.js";
import { AppError } from "../../util/AppError.js";
import stripe from "../../util/stripe.js";

async function routes(app, options) {
  app.post("/subscriptions", async (request, reply) => {
    const { customerId, paymentMethodId, priceId } = request.body;

    let stripeSubscription;
    const customer = await prisma.customers.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer || !customer.stripeId) throw new AppError(404, "Customer not found");

    const stripePrice = await stripe.prices.retrieve(priceId);
    if (stripePrice && stripePrice.unit_amount) {
      stripeSubscription = await stripe.subscriptions.create({
        customer: customer.stripeId,
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
        { metadata: { payment_method: paymentMethodId } }
      );
      const amount = stripePrice.unit_amount / 100;

      let subscription = await prisma.subscriptions.findUnique({
        where: {
          CustomerId: customerId,
        },
      });

      if (subscription) {
        subscription = await prisma.subscriptions.update({
          where: {
            CustomerId: customerId,
          },
          data: {
            status: "DRAFT",
            amount,
            stripeId: stripeSubscription.id,
          },
        });
      } else {
        subscription = await prisma.subscriptions.create({
          data: {
            status: "DRAFT",
            amount,
            startDate: null,
            endDate: null,
            CustomerId: customerId,
            stripeId: stripeSubscription.id,
          },
        });
      }

      await prisma.paymentIntents.create({
        data: {
          amount,
          stripeId: stripePaymentIntent?.id,
          SubscriptionId: subscription.id,
        },
      });

      // TODO: check this works
      reply.send(stripePaymentIntent?.client_secret);
    }
  });

  app.put("/subscriptions/:subscriptionId/refund", async (request, reply) => {
    const subscriptionId = Number(request.params.subscriptionId);
    const subscription = await prisma.subscriptions.findFirst({
      where: {
        id: subscriptionId,
        status: "VALIDATED",
      },
      include: {
        PaymentIntents: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!subscription || !subscription.stripeId) throw new AppError(404, "Subscription not found");

    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeId);
    if (stripeSubscription?.id) {
      const startDate = new Date(stripeSubscription.current_period_start * 1000);
      const endDate = new Date(stripeSubscription.current_period_end * 1000);
      const currentDate = new Date();
      // @ts-ignore
      const totalMinutes = Math.ceil((endDate - startDate) / (1000 * 60));
      // @ts-ignore
      const unusedMinutes = Math.ceil((endDate - currentDate) / (1000 * 60));
      const refundPercentage = unusedMinutes / totalMinutes;
      const refundAmount = Math.round(refundPercentage * (stripeSubscription.items.data[0].price.unit_amount || 0));

      const stripePaymentIntentId = subscription.PaymentIntents[0].stripeId;
      let refund;
      if (refundAmount && stripePaymentIntentId) {
        refund = await stripe.refunds.create({
          amount: refundAmount,
          payment_intent: stripePaymentIntentId,
        });
      }
      await stripe.subscriptions.del(subscription.stripeId);

      const updatedSubscription = await prisma.subscriptions.update({
        where: {
          id: subscriptionId,
        },
        data: {
          status: "CANCELLED",
          endDate: new Date(),
          proratedAmount: refundAmount / 100,
          refundId: refund?.id,
        },
      });

      return updatedSubscription;
    }
  });

  app.get("/subscriptions/:subscriptionId", async (request, reply) => {
    const subscription = await prisma.subscriptions.findFirst({
      where: {
        id: Number(request.params.subscriptionId),
      },
    });

    if (!subscription) throw new AppError(404, "Not found");

    return {
      ...subscription,
      stripeId: null,
    };
  });
}

export default routes;
