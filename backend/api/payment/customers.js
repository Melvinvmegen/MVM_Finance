import { prisma, Models } from "../../utils/prisma.js";
import { AppError } from "../../utils/AppError.js";
import stripe from "../../utils/stripe.js";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$post("/customers", createCustomer);
}

/**
 * @this {API.This}
 * @param {Models.Prisma.customerUncheckedCreateInput} body
 * @returns {Promise<Models.customer>}
 */
async function createCustomer(body) {
  const { first_name, last_name, email } = body;
  let customer = await prisma.customer.findFirst({
    where: {
      email,
    },
  });

  let stripeCustomer;
  if (!(customer && customer.stripe_id)) {
    stripeCustomer = await stripe.customers.create({
      email,
      name: `${first_name} ${last_name}`,
    });
  }

  if (!stripeCustomer) throw new AppError(401, "Unauthorized");

  if (customer) {
    customer = await prisma.customer.update({
      where: {
        id: +customer.id,
      },
      data: {
        stripe_id: stripeCustomer?.id,
        email,
        first_name,
        last_name,
      },
    });
  } else {
    customer = await prisma.customer.create({
      data: {
        stripe_id: stripeCustomer?.id,
        email,
        first_name,
        last_name,
      },
    });
  }

  return customer;
}
