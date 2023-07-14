import { prisma, Models } from "../../util/prisma.js";
import { AppError } from "../../util/AppError.js";
import stripe from "../../util/stripe.js";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$post("/customers", createCustomer);
}

/**
 * @this {API.This}
 * @param {Models.Prisma.CustomersUncheckedCreateInput} body
 * @returns {Promise<Models.Customers>}
 */
async function createCustomer(body) {
  const { firstName, lastName, email } = body;
  let customer = await prisma.customers.findFirst({
    where: {
      email,
    },
  });

  let stripeCustomer;
  if (!(customer && customer.stripeId)) {
    stripeCustomer = await stripe.customers.create({
      email,
      name: `${firstName} ${lastName}`,
    });
  }

  if (!stripeCustomer) throw new AppError(401, "Unauthorized");

  if (customer) {
    customer = await prisma.customers.update({
      where: {
        id: +customer.id,
      },
      data: {
        stripeId: stripeCustomer?.id,
        email,
        firstName,
        lastName,
      },
    });
  } else {
    customer = await prisma.customers.create({
      data: {
        stripeId: stripeCustomer?.id,
        email,
        firstName,
        lastName,
      },
    });
  }

  return customer;
}
