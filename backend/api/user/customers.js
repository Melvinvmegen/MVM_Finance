import express from "express";
import { getOrSetCache, invalidateCache } from "../../util/cacheManager.js";
import { setFilters } from "../../util/filter.js";
import { AppError } from "../../util/AppError.js";
import { prisma } from "../../util/prisma.js";
const router = express.Router();

router.get("/", async (req, res, next) => {
  const { per_page, offset, options } = setFilters(req.query);
  const force = req.query.force === "true";
  options.UserId = req?.auth?.userId;

  try {
    const result = await getOrSetCache(
      "customers",
      async () => {
        const count = await prisma.customers.count();
        const rows = await prisma.customers.findMany({
          where: options,
          include: {
            Invoices: true,
          },
          skip: offset,
          take: per_page,
        });

        return { rows, count };
      },
      force
    );

    res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await getOrSetCache(`customer_${id}`, async () => {
      const customer = await prisma.customers.findFirst({
        where: {
          id: +id,
          UserId: +req?.auth?.userId,
        },
      });

      if (!customer) throw new AppError(404, "Customer not found!");
      return customer;
    });

    res.json(customer);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const customer = await prisma.customers.create({
      data: {
        ...req.body,
        UserId: req?.auth?.userId,
      },
      include: {
        Invoices: true,
      },
    });
    await invalidateCache("customers");
    res.json(customer);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  const { Invoices, Quotations, ...body } = req.body;
  try {
    let customer = await prisma.customers.findFirst({
      where: {
        id: +body.id,
        UserId: req?.auth?.userId,
      },
    });

    if (!customer) throw new AppError(404, "Customer not found!");

    customer = await prisma.customers.update({
      where: {
        id: +req.body.id,
      },
      data: {
        ...body,
        UserId: req?.auth?.userId,
      },
    });

    await invalidateCache(`customer_${customer.id}`);
    res.json(customer);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.customers.delete({
      where: {
        id: +req.params.id,
      },
    });
    await invalidateCache("customers");
    res.json();
  } catch (error) {
    return next(error);
  }
});

export default router;
