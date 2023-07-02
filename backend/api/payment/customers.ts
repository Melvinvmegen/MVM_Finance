import express, { Request, Response, NextFunction } from "express";
import { prisma } from "../../util/prisma.js";
import { AppError } from "../../util/AppError.js";
import stripe from "../../util/stripe.js";

const router = express.Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  let customer;
  const { firstName, lastName, email } = req.body;
  try {
    customer = await prisma.customers.findFirst({
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
  } catch (error) {
    return next(error);
  }

  res.json(customer);
});

export default router;
