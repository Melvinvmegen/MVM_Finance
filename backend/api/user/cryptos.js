import { getOrSetCache, invalidateCache } from "../../util/cacheManager.js";
import { updateCreateOrDestroyChildItems } from "../../util/childItemsHandler.js";
import { prisma } from "../../util/prisma.js";
import { AppError } from "../../util/AppError.js";
import axios from "axios";

async function routes(app, options) {
  app.get("/cryptos", async (request, reply) => {
    const cryptos = await getOrSetCache(`cryptos`, async () => {
      const data = await prisma.cryptoCurrencies.findMany({
        where: {
          UserId: request.auth?.userId,
        },
        orderBy: [{ sold: "asc" }, { profit: "desc" }],
        include: {
          Transactions: true,
        },
      });

      return data;
    });

    return cryptos;
  });

  app.post("/cryptos", async (request, reply) => {
    const { Transactions, ...cryptoBody } = request.body;
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

    const fetchedCrypto = response.data.data.filter((element) => element.name === request.body.name);
    const values = fetchedCrypto[0]?.quote?.EUR;
    const totalTransactions = request.body.Transactions.map(
      (transaction) => transaction.price * transaction.quantity
    ).reduce((sum, quantiy) => sum + quantiy, 0);
    const totalQuantityTransactions = request.body.Transactions.map((transaction) => transaction.quantity).reduce(
      (sum, quantiy) => sum + quantiy,
      0
    );

    const transactions_created = Transactions.map(async (transaction) => {
      const initialDate = new Date(transaction.buyingDate);
      const firstDay = new Date(initialDate.getFullYear(), initialDate.getMonth());
      const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0);

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

      if (revenu?.Banks?.UserId !== request.auth?.userId) revenu = null;

      return {
        ...transaction,
        RevenuId: revenu?.id,
      };
    });

    const crypto = await prisma.cryptoCurrencies.create({
      data: {
        ...cryptoBody,
        pricePurchase: totalTransactions / totalQuantityTransactions,
        price: request.body.price || values?.price || 0,
        priceChange: values?.percent_change_30d || 0,
        UserId: request.auth?.userId,
        Transactions: {
          create: await Promise.all(transactions_created),
        },
      },
      include: {
        Transactions: true,
      },
    });

    await invalidateCache(`cryptos`);
    return crypto;
  });

  app.put("/cryptos/:id", async (request, reply) => {
    const { Transactions, ...crypto_body } = request.body;

    let crypto = await prisma.cryptoCurrencies.findFirst({
      where: {
        id: +request.params.id,
        UserId: request.auth?.userId,
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
    const fetchedCrypto = response.data.data.filter((element) => element.name === request.body.name);
    const values = fetchedCrypto[0]?.quote?.EUR;
    const totalTransactions = Transactions.map((transaction) => transaction.price * transaction.quantity).reduce(
      (sum, quantity) => sum + quantity,
      0
    );
    const totalQuantityTransactions = Transactions.map((transaction) => transaction.quantity).reduce(
      (sum, quantity) => sum + quantity,
      0
    );

    if (Transactions.length) {
      const existing_transactions = await prisma.transactions.findMany({
        where: {
          CryptoCurrencyId: crypto_body.id,
        },
      });

      const new_transactions = Transactions.map(async (transaction) => {
        const initialDate = new Date(transaction.buyingDate);
        const firstDay = new Date(initialDate.getFullYear(), initialDate.getMonth());
        const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0);

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

        if (revenu?.Banks?.UserId !== request.auth?.userId) revenu = null;

        return {
          ...transaction,
          RevenuId: revenu?.id,
        };
      });

      await updateCreateOrDestroyChildItems("Transactions", existing_transactions, await Promise.all(new_transactions));
    }

    crypto = await prisma.cryptoCurrencies.update({
      where: { id: +request.params.id },
      data: {
        ...crypto_body,
        pricePurchase: totalTransactions / (totalQuantityTransactions || 1),
        price: request.body.price || values?.price,
        priceChange: values?.percent_change_30d || 0,
        UserId: request.auth?.userId,
      },
    });

    await invalidateCache(`cryptos`);
    return crypto;
  });

  app.get("/cryptos/update_cryptos", async (request, reply) => {
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
    // @ts-ignore
    const response = await axios(requestOptions);
    const cryptos = await prisma.cryptoCurrencies.findMany({
      where: {
        UserId: request.auth?.userId,
      },
    });
    let updated_cryptos = [];

    for (let crypto of cryptos) {
      const foundCrypto = response.data.data.filter((element) => element.name === crypto.name)[0];

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
    return updated_cryptos;
  });
}

export default routes;
