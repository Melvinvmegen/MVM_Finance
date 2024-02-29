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
 * @returns {Promise<Models.crypto_currency>}
 */
export async function getCryptos(params) {
  const force = params.force === "true";
  let error;
  const cryptos = await getOrSetCache(
    `user_${this.request.user?.id}_cryptos`,
    async () => {
      try {
        const data = await prisma.crypto_currency.findMany({
          where: {
            user_id: this.request.user?.id || null,
          },
          orderBy: [{ sold: "asc" }, { profit: "desc" }],
          include: {
            transactions: true,
          },
        });

        return data;
      } catch (err) {
        error = err;
        throw new Error(err);
      }
    },
    force
  );

  if (error) {
    throw new Error(`An expected error occured: ${error}`);
  }

  return cryptos;
}
/**
 * @this {API.This}
 * @param {Models.Prisma.crypto_currencyUncheckedCreateInput & { transactions: Models.Prisma.transactionCreateInput[] }} body
 * @returns {Promise<Models.crypto_currency & { transactions: Models.transaction[] }>}
 */
export async function createCrypto(body) {
  const response = await ofetch(`${settings.coinmarketcap.apiBaseUrl}?start=1&limit=5000&convert=EUR`, {
    method: "GET",
    headers: { "X-CMC_PRO_API_KEY": settings.coinmarketcap.apiKey },
  });
  const transactionsToCreate = body.transactions.map(async (transaction) => {
    const initialDate = dayjs(transaction.buying_date || transaction.created_at);
    const firstDay = initialDate.startOf("month").toDate();
    const lastDay = initialDate.endOf("month").toDate();
    const revenu = await prisma.revenu.findFirst({
      where: {
        created_at: {
          lte: lastDay,
          gte: firstDay,
        },
        user_id: this.request.user?.id || null,
      },
    });

    return {
      ...transaction,
      revenu_id: revenu?.id,
    };
  });

  const fetchedCrypto = response.data.filter((element) => element.name === body.name);
  const totalTransactions = body.transactions
    .map((transaction) => transaction.price * transaction.quantity)
    .reduce((sum, quantiy) => sum + quantiy, 0);
  const totalQuantityTransactions = body.transactions
    .map((transaction) => transaction.quantity)
    .reduce((sum, quantiy) => sum + quantiy, 0);
  const amounts = fetchedCrypto[0]?.quote?.EUR;
  const crypto = await prisma.crypto_currency.create({
    data: {
      name: body.name,
      category: body.category,
      profit: body.profit,
      price_purchase: totalTransactions / totalQuantityTransactions,
      price: body.price || amounts?.price || 0,
      price_change: amounts?.percent_change_30d || 0,
      user_id: this.request.user?.id || null,
      transactions: {
        create: await Promise.all(transactionsToCreate),
      },
    },
    include: {
      transactions: true,
    },
  });

  await invalidateCache(`user_${this.request.user?.id}_cryptos`);
  return crypto;
}

/**
 * @this {API.This}
 * @param {number} crypto_id
 * @param {Models.Prisma.crypto_currencyUncheckedUpdateInput & { transactions: Models.Prisma.transactionCreateInput[]}} body
 */
export async function updateCrypto(crypto_id, body) {
  let crypto = await prisma.crypto_currency.findFirst({
    where: {
      id: +crypto_id,
      user_id: this.request.user?.id || null,
    },
  });

  if (!crypto) throw new AppError("Crypto not found!");

  const response = await ofetch(`${settings.coinmarketcap.apiBaseUrl}?start=1&limit=5000&convert=EUR`, {
    method: "GET",
    headers: { "X-CMC_PRO_API_KEY": settings.coinmarketcap.apiKey },
  });
  const fetchedCrypto = response.data.filter((element) => element.name === body.name);
  const amounts = fetchedCrypto[0]?.quote?.EUR;
  const totalTransactions = body.transactions
    .map((transaction) => +transaction.price * +transaction.quantity)
    .reduce((sum, quantity) => sum + quantity, 0);
  const totalQuantityTransactions = body.transactions
    .map((transaction) => transaction.quantity)
    .reduce((sum, quantity) => +sum + +quantity, 0);

  if (body.transactions.length) {
    const existing_transactions = await prisma.transaction.findMany({
      where: {
        crypto_currency_id: +crypto_id,
      },
    });

    const new_transaction = body.transactions.map(async (transaction) => {
      const initialDate = dayjs(transaction.buying_date || transaction.created_at);
      const firstDay = initialDate.startOf("month").toDate();
      const lastDay = initialDate.endOf("month").toDate();

      let revenu = await prisma.revenu.findFirst({
        where: {
          created_at: {
            lte: lastDay,
            gte: firstDay,
          },
          user_id: this.request.user?.id || null,
        },
      });

      return {
        ...transaction,
        revenu_id: revenu?.id,
      };
    });

    await updateCreateOrDestroyChildItems("transaction", existing_transactions, await Promise.all(new_transaction));
  }

  crypto = await prisma.crypto_currency.update({
    where: { id: +crypto_id, user_id: this.request.user?.id },
    data: {
      name: `${body.name}`.trim(),
      category: body.category,
      profit: body.profit,
      price_purchase: totalTransactions / (+totalQuantityTransactions || 1),
      price: body.price || amounts?.price,
      price_change: amounts?.percent_change_30d || 0,
      sold: body.sold,
    },
  });

  await invalidateCache(`user_${this.request.user?.id}_cryptos`);
  return crypto;
}

/**
 * @this {API.This}
 * @returns {Promise<Models.crypto_currency[]>}
 */
export async function refreshCryptos() {
  const response = await ofetch(`${settings.coinmarketcap.apiBaseUrl}?start=1&limit=5000&convert=EUR`, {
    method: "GET",
    headers: { "X-CMC_PRO_API_KEY": settings.coinmarketcap.apiKey },
  });
  const cryptos = await prisma.crypto_currency.findMany({
    where: {
      user_id: this.request.user?.id || null,
    },
  });
  let updatedCryptos = [];

  for (let crypto of cryptos) {
    const foundCrypto = response.data.filter((element) => element.name === crypto.name)[0];
    if (!foundCrypto) continue;
    const currentPrice = foundCrypto?.quote?.EUR?.price;
    const updatedCrypto = await prisma.crypto_currency.update({
      where: {
        id: crypto.id,
        user_id: this.request.user?.id || null,
      },
      data: {
        price: currentPrice,
        price_change: currentPrice - crypto.price_purchase,
      },
    });
    updatedCryptos.push(updatedCrypto);
  }

  await invalidateCache(`user_${this.request.user?.id}_cryptos`);
  return updatedCryptos;
}
