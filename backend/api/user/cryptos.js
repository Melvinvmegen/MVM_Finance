import { getOrSetCache, invalidateCache } from "../../utils/cacheManager.js";
import { updateCreateOrDestroyChildItems } from "../../utils/childItemsHandler.js";
import { prisma, Models } from "../../utils/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { settings } from "../../utils/settings.js";
import { ofetch } from "ofetch";
import dayjs from "dayjs";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$get("/cryptos", getCryptos);
  app.$post("/cryptos", createCrypto);
  app.$put("/cryptos/:id", updateCrypto);
  app.$get("/cryptos/refresh-cryptos", refreshCryptos);
}
/**
 * @this {API.This}
 * @param {{ force: string }} params
 * @returns {Promise<Models.CryptoCurrencies>}
 */
export async function getCryptos(params) {
  const force = params.force === "true";
  const cryptos = await getOrSetCache(
    `user_${this.request.user?.id}_cryptos`,
    async () => {
      const data = await prisma.cryptoCurrencies.findMany({
        where: {
          UserId: this.request.user?.id || null,
        },
        orderBy: [{ sold: "asc" }, { profit: "desc" }],
        include: {
          Transactions: true,
        },
      });

      return data;
    },
    force
  );

  return cryptos;
}
/**
 * @this {API.This}
 * @param {Models.Prisma.CryptoCurrenciesUncheckedCreateInput & { Transactions: Models.Prisma.TransactionsCreateInput[] }} body
 * @returns {Promise<Models.CryptoCurrencies & { Transactions: Models.Transactions[] }>}
 */
export async function createCrypto(body) {
  const response = await ofetch(`${settings.coinmarketcap.apiBaseUrl}?start=1&limit=5000&convert=EUR`, {
    method: "GET",
    headers: { "X-CMC_PRO_API_KEY": settings.coinmarketcap.apiKey },
  });
  const transactionsToCreate = body.Transactions.map(async (transaction) => {
    const initialDate = dayjs(transaction.buyingDate || transaction.createdAt);
    const firstDay = initialDate.startOf("month").toDate();
    const lastDay = initialDate.endOf("month").toDate();
    const revenu = await prisma.revenus.findFirst({
      where: {
        createdAt: {
          lte: lastDay,
          gte: firstDay,
        },
        UserId: this.request.user?.id || null,
      },
    });

    return {
      ...transaction,
      RevenuId: revenu?.id,
    };
  });

  const fetchedCrypto = response.data.filter((element) => element.name === body.name);
  const totalTransactions = body.Transactions.map((transaction) => transaction.price * transaction.quantity).reduce(
    (sum, quantiy) => sum + quantiy,
    0
  );
  const totalQuantityTransactions = body.Transactions.map((transaction) => transaction.quantity).reduce(
    (sum, quantiy) => sum + quantiy,
    0
  );
  const amounts = fetchedCrypto[0]?.quote?.EUR;
  const crypto = await prisma.cryptoCurrencies.create({
    data: {
      name: body.name,
      category: body.category,
      profit: body.profit,
      pricePurchase: totalTransactions / totalQuantityTransactions,
      price: body.price || amounts?.price || 0,
      priceChange: amounts?.percent_change_30d || 0,
      UserId: this.request.user?.id || null,
      Transactions: {
        create: await Promise.all(transactionsToCreate),
      },
    },
    include: {
      Transactions: true,
    },
  });

  await invalidateCache(`cryptos`);
  return crypto;
}

/**
 * @this {API.This}
 * @param {number} cryptoId
 * @param {Models.Prisma.CryptoCurrenciesUncheckedUpdateInput & { Transactions: Models.Prisma.TransactionsCreateInput[]}} body
 */
export async function updateCrypto(cryptoId, body) {
  let crypto = await prisma.cryptoCurrencies.findFirst({
    where: {
      id: +cryptoId,
      UserId: this.request.user?.id || null,
    },
  });

  if (!crypto) throw new AppError("Crypto not found!");

  const response = await ofetch(`${settings.coinmarketcap.apiBaseUrl}?start=1&limit=5000&convert=EUR`, {
    method: "GET",
    headers: { "X-CMC_PRO_API_KEY": settings.coinmarketcap.apiKey },
  });
  const fetchedCrypto = response.data.filter((element) => element.name === body.name);
  const amounts = fetchedCrypto[0]?.quote?.EUR;
  const totalTransactions = body.Transactions.map((transaction) => +transaction.price * +transaction.quantity).reduce(
    (sum, quantity) => sum + quantity,
    0
  );
  const totalQuantityTransactions = body.Transactions.map((transaction) => transaction.quantity).reduce(
    (sum, quantity) => +sum + +quantity,
    0
  );

  if (body.Transactions.length) {
    const existing_transactions = await prisma.transactions.findMany({
      where: {
        CryptoCurrencyId: +cryptoId,
      },
    });

    const newTransactions = body.Transactions.map(async (transaction) => {
      const initialDate = dayjs(transaction.buyingDate || transaction.createdAt);
      const firstDay = initialDate.startOf("month").toDate();
      const lastDay = initialDate.endOf("month").toDate();

      let revenu = await prisma.revenus.findFirst({
        where: {
          createdAt: {
            lte: lastDay,
            gte: firstDay,
          },
          UserId: this.request.user?.id || null,
        },
      });

      return {
        ...transaction,
        RevenuId: revenu?.id,
      };
    });

    await updateCreateOrDestroyChildItems("Transactions", existing_transactions, await Promise.all(newTransactions));
  }

  crypto = await prisma.cryptoCurrencies.update({
    where: { id: +cryptoId, UserId: this.request.user?.id },
    data: {
      name: `${body.name}`.trim(),
      category: body.category,
      profit: body.profit,
      pricePurchase: totalTransactions / (+totalQuantityTransactions || 1),
      price: body.price || amounts?.price,
      priceChange: amounts?.percent_change_30d || 0,
      sold: body.sold,
    },
  });

  await invalidateCache(`cryptos`);
  return crypto;
}

/**
 * @this {API.This}
 * @returns {Promise<Models.CryptoCurrencies[]>}
 */
export async function refreshCryptos() {
  const response = await ofetch(`${settings.coinmarketcap.apiBaseUrl}?start=1&limit=5000&convert=EUR`, {
    method: "GET",
    headers: { "X-CMC_PRO_API_KEY": settings.coinmarketcap.apiKey },
  });
  const cryptos = await prisma.cryptoCurrencies.findMany({
    where: {
      UserId: this.request.user?.id || null,
    },
  });
  let updatedCryptos = [];

  for (let crypto of cryptos) {
    const foundCrypto = response.data.filter((element) => element.name === crypto.name)[0];
    if (!foundCrypto) continue;
    const currentPrice = foundCrypto?.quote?.EUR?.price;
    const updatedCrypto = await prisma.cryptoCurrencies.update({
      where: {
        id: crypto.id,
        UserId: this.request.user?.id || null,
      },
      data: {
        price: currentPrice,
        priceChange: currentPrice - crypto.pricePurchase,
      },
    });
    updatedCryptos.push(updatedCrypto);
  }

  await invalidateCache(`cryptos`);
  return updatedCryptos;
}
