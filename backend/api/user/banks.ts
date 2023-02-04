import express, { Response, NextFunction } from "express";
import { Request as JWTRequest } from "express-jwt";
import { getOrSetCache, invalidateCache } from "../../util/cacheManager.js";
import { AppError } from "../../util/AppError.js";
import { prisma } from "../../util/prisma.js";
const router = express.Router();

router.get(
  "/",
  async (req: JWTRequest, res: Response, next: NextFunction) => {
    const force = req.query.force === "true";
    try {
      const result = await getOrSetCache(
        "banks",
        async () => {
          const banks = await prisma.banks.findMany({
            where: {
              UserId: req?.auth?.userId,
            },
          });

          return banks;
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
  "/:id",
  async (req: JWTRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const bank = await getOrSetCache(`bank_${id}`, async () => {
        const bank = await prisma.banks.findFirst({
          where: {
            id: +id,
            UserId: req?.auth?.userId,
          },
        });
        if (!bank) throw new AppError(404, "Bank not found!");
        return bank;
      });

      res.json(bank);
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/",
  async (req: JWTRequest, res: Response, next: NextFunction) => {
    try {
      const bank = await prisma.banks.create({
        data: {
          ...req.body,
          UserId: req?.auth?.userId,
        },
      });
      await invalidateCache("banks");
      res.json(bank);
    } catch (error) {
      return next(error);
    }
  }
);

router.put(
  "/:id",
  async (req: JWTRequest, res: Response, next: NextFunction) => {
    const { Invoices, Quotations, ...body } = req.body;
    try {
      let bank = await prisma.banks.findFirst({
        where: {
          id: +body.id,
          UserId: req?.auth?.userId,
        },
      });

      if (!bank) throw new AppError(404, "Bank not found!");

      bank = await prisma.banks.update({
        where: { 
          id: +body.id,
        },
        data: {
          ...body,
          UserId: req?.auth?.userId,
        },
      });

      await invalidateCache(`bank_${bank.id}`);
      res.json(bank);
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
