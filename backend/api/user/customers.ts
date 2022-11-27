import express, { Request, Response, NextFunction } from "express";
import { getOrSetCache, invalidateCache } from "../../util/cacheManager.js";
import { setFilters } from "../../util/filter.js";
import { AppError } from "../../util/AppError.js";
import { prisma } from "../../util/prisma.js";
const router = express.Router();

router.get(
  "/customers",
  async (req: Request, res: Response, next: NextFunction) => {
    const { per_page, offset, options } = setFilters(req.query);
    const force = req.query.force === "true";
    try {
      const result = await getOrSetCache(
        "customers",
        async () => {
          const count = await prisma.customers.count();
          const customers = await prisma.customers.findMany({
            where: options,
            include: {
              Invoices: true,
            },
            skip: offset,
            take: per_page,
          });

          return { rows: customers, count };
        },
        force
      );

      res.json(result);
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/customer/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const customer = await getOrSetCache(`customer_${id}`, async () => {
        const customer = await prisma.customers.findUnique({
          where: { id: +id },
        });
        if (!customer) throw new AppError(404, "Customer not found!");
        return customer;
      });

      res.json(customer);
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/customer",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await prisma.customers.create({
        data: req.body,
      });
      await invalidateCache("customers");
      res.json(customer);
    } catch (error) {
      return next(error);
    }
  }
);

router.put(
  "/customer/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const { Invoices, Quotations, ...body} = req.body;
    try {
      const customer = await prisma.customers.update({
        where: { id: +req.body.id },
        data: body,
      })

      await invalidateCache(`customer_${customer.id}`);
      res.json(customer);
    } catch (error) {
      return next(error);
    }
  }
);

router.delete(
  "/customer/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.customers.delete({
        where: { id: +req.params.id }
      });
      await invalidateCache("customers");
      res.json();
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
