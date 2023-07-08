import { prisma } from "../../util/prisma.js";
import { AppError } from "../../util/AppError.js";
import stripe from "../../util/stripe.js";

async function routes(app, options) {
  app.post("/customers", async (request, reply) => {
    const { firstName, lastName, email } = request.body;
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
  });
}

export default routes;
