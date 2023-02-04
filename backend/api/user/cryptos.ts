import express, { Response, NextFunction } from "express";
import { Request as JWTRequest } from "express-jwt";
import { getOrSetCache, invalidateCache } from "../../util/cacheManager.js";
import { updateCreateOrDestroyChildItems } from "../../util/childItemsHandler.js";
import { prisma } from "../../util/prisma.js";
import { AppError } from "../../util/AppError.js";
import axios from "axios";
const router = express.Router();

router.get(
  "/",
  async (req: JWTRequest, res: Response, next: NextFunction) => {
    try {
      const cryptos = await getOrSetCache(`cryptos`, async () => {
        const data = await prisma.cryptoCurrencies.findMany({
          where: {
            UserId: req?.auth?.userId,
          },
          orderBy: [
            {sold: "asc"},
            {profit: "desc"}
          ],
          include: {
            Transactions: true,
          },
        });

        return data;
      });

      res.json(cryptos);
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/",
  async (req: JWTRequest, res: Response, next: NextFunction) => {
    const { Transactions, ...cryptoBody } = req.body;
    try {
      // @ts-ignore
      const response = await axios({
        method: "GET",
        url: "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
        params: {
          start: "1",
          limit: "5000",
          convert: "EUR",
        },
        headers: {
          "X-CMC_PRO_API_KEY": "9a874839-5e36-4cec-bcbe-ac2f7927c74f",
        },
        json: true,
        gzip: true,
      });

      const fetchedCrypto = response.data.data.filter(
        (element: any) => element.name === req.body.name
      );
      const values = fetchedCrypto[0]?.quote?.EUR;
      const totalTransactions = req.body.Transactions.map(
        (transaction: any) => transaction.price * transaction.quantity
      ).reduce((sum: number, quantiy: number) => sum + quantiy, 0);
      const totalQuantityTransactions = req.body.Transactions.map(
        (transaction: any) => transaction.quantity
      ).reduce((sum: number, quantiy: number) => sum + quantiy, 0);

      const transactions_created = Transactions.map(
        async (transaction: any) => {
          const initialDate = new Date(transaction.buyingDate);
          const firstDay = new Date(
            initialDate.getFullYear(),
            initialDate.getMonth()
          );
          const lastDay = new Date(
            firstDay.getFullYear(),
            firstDay.getMonth() + 1,
            0
          );

          let revenu = await prisma.revenus.findFirst({
            where: {
              createdAt: {
                lte: lastDay,
                gte: firstDay,
              },
            },
            include: {
              Banks: true,
            },
          });
  
          if (revenu?.Banks?.UserId !== req?.auth?.userId) revenu = null;

          return {
            ...transaction,
            RevenuId: revenu?.id,
          };
        }
      );

      const crypto = await prisma.cryptoCurrencies.create({
        data: {
          ...cryptoBody,
          pricePurchase: totalTransactions / totalQuantityTransactions,
          price: req.body.price || values?.price || 0,
          priceChange: values?.percent_change_30d || 0,
          UserId: req?.auth?.userId,
          Transactions: {
            create: await Promise.all(transactions_created),
          },
        },
        include: {
          Transactions: true,
        },
      });

      await invalidateCache(`cryptos`);
      res.json(crypto);
    } catch (error) {
      return next(error);
    }
  }
);

router.put(
  "/:id",
  async (req: JWTRequest, res: Response, next: NextFunction) => {
    const { Transactions, ...crypto_body } = req.body;

    try {

      let crypto = await prisma.cryptoCurrencies.findFirst({
        where: {
          id: +req.params.id,
          UserId: req?.auth?.userId,
        },
      });

      if (!crypto) throw new AppError(404, "Crypto not found!");

      // @ts-ignore
      const response = await axios({
        method: "GET",
        url: "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
        params: {
          start: "1",
          limit: "5000",
          convert: "EUR",
        },
        headers: {
          "X-CMC_PRO_API_KEY": "9a874839-5e36-4cec-bcbe-ac2f7927c74f",
        },
        json: true,
        gzip: true,
      });
      const fetchedCrypto = response.data.data.filter(
        (element: any) => element.name === req.body.name
      );
      const values = fetchedCrypto[0]?.quote?.EUR;
      const totalTransactions = Transactions.map(
        (transaction: any) => transaction.price * transaction.quantity
      ).reduce((sum: number, quantity: number) => sum + quantity, 0);
      const totalQuantityTransactions = Transactions.map(
        (transaction: any) => transaction.quantity
      ).reduce((sum: number, quantity: number) => sum + quantity, 0);

      if (Transactions.length) {
        const existing_transactions = await prisma.transactions.findMany({
          where: {
            CryptoCurrencyId: crypto_body.id,
          },
        });

        const new_transactions = Transactions.map(async (transaction: any) => {
          const initialDate = new Date(transaction.buyingDate);
          const firstDay = new Date(
            initialDate.getFullYear(),
            initialDate.getMonth()
          );
          const lastDay = new Date(
            firstDay.getFullYear(),
            firstDay.getMonth() + 1,
            0
          );

          let revenu = await prisma.revenus.findFirst({
            where: {
              createdAt: {
                lte: lastDay,
                gte: firstDay,
              },
            },
            include: {
              Banks: true,
            },
          });
  
          if (revenu?.Banks?.UserId !== req?.auth?.userId) revenu = null;

          return {
            ...transaction,
            RevenuId: revenu?.id,
          };
        });

        await updateCreateOrDestroyChildItems(
          "Transactions",
          existing_transactions,
          await Promise.all(new_transactions)
        );
      }

      crypto = await prisma.cryptoCurrencies.update({
        where: { id: +req.params.id },
        data: {
          ...crypto_body,
          pricePurchase: totalTransactions / (totalQuantityTransactions || 1),
          price: req.body.price || values?.price,
          priceChange: values?.percent_change_30d || 0,
          UserId: req?.auth?.userId,
        },
      });

      await invalidateCache(`cryptos`);
      res.json(crypto);
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/update_cryptos",
  async (req: JWTRequest, res: Response, next: NextFunction) => {
    let requestOptions = {
      method: "GET",
      url: "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
      params: {
        start: "1",
        limit: "5000",
        convert: "EUR",
      },
      headers: {
        "X-CMC_PRO_API_KEY": "9a874839-5e36-4cec-bcbe-ac2f7927c74f",
      },
      json: true,
      gzip: true,
    };
    try {
      // @ts-ignore
      const response = await axios(requestOptions);
      const cryptos = await prisma.cryptoCurrencies.findMany({
        where: {
          UserId: req?.auth?.userId,
        }
      });
      let updated_cryptos = [];

      for (let crypto of cryptos) {
        const foundCrypto = response.data.data.filter(
          (element: any) => element.name === crypto.name
        )[0];

        const updated_crypto = await prisma.cryptoCurrencies.update({
          where: {
            id: crypto.id,
          },
          data: {
            price: foundCrypto?.quote?.EUR?.price,
            priceChange: crypto.price - crypto.pricePurchase,
          },
        });
        updated_cryptos.push(updated_crypto);
      }

      await invalidateCache(`cryptos`);
      res.json(updated_cryptos);
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
