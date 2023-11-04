import { getOrSetCache, invalidateCache } from "../../utils/cacheManager.js";
import { AppError } from "../../utils/AppError.js";
import { prisma, Models } from "../../utils/prisma.js";
import { Prisma } from "@prisma/client";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$get("/cash-pots", getCashPots);
  app.$get("/cash-pots/:cashPotId", getCashPot);
  app.$post("/cash-pots", createCashPot);
  app.$put("/cash-pots/:cashPotId", updateCashPot);
}

/**
 * @this {API.This}
 * @param {{ force: string }} params
 * @returns {Promise<Models.CashPots[]>}
 */
export async function getCashPots(params) {
  const force = params.force === "true";
  const result = await getOrSetCache(
    "cashPots",
    async () => {
      const cashPots = await prisma.$queryRaw`
        SELECT
          cashPots.id,
          cashPots.amount,
          cashPots.name,
          cashPots."amountDate",
          COALESCE(
              (SELECT SUM(costs.total)
              FROM "Costs" costs
              WHERE costs."CashPotId" = cashPots.id
              AND costs."paymentMean" = 'CARD'
              AND costs."createdAt" >= cashPots."amountDate"), 0) as sum_costs,
          COALESCE(
              (SELECT SUM(credits.total)
              FROM "Credits" credits
              WHERE credits."CashPotId" = cashPots.id
              AND credits.category <> 'CASH'
              AND credits."createdAt" >= cashPots."amountDate"), 0) as sum_credits
        FROM
          "CashPots" as cashPots
        JOIN "Users" as users ON users.id = cashPots."UserId"
        WHERE
          users.id = ${this.request.user?.id}
        ORDER BY cashPots.amount DESC`;

      return cashPots;
    },
    force
  );

  return result;
}

/**
 * @this {API.This}
 * @param {number} cashPotId
 * @returns {Promise<Models.CashPots>}
 */
export async function getCashPot(cashPotId) {
  const cashPot = await getOrSetCache(`cashPot_${cashPotId}`, async () => {
    const cashPot = await prisma.cashPots.findFirst({
      where: {
        id: +cashPotId,
        UserId: this.request.user?.id,
      },
    });
    if (!cashPot) throw new AppError("CashPot not found!");
    return cashPot;
  });

  return cashPot;
}

/**
 * @this {API.This}
 * @param {Models.Prisma.CashPotsUncheckedCreateInput} body
 * @returns {Promise<Models.CashPots>}
 */
export async function createCashPot(body) {
  const cashPot = await prisma.cashPots.create({
    data: {
      ...body,
      UserId: this.request.user?.id,
    },
  });
  await invalidateCache("cashPots");
  return cashPot;
}

/**
 * @this {API.This}
 * @param {number} cashPotId
 * @param {Models.Prisma.CashPotsUncheckedUpdateInput} body
 * @returns
 */

export async function updateCashPot(cashPotId, body) {
  let cashPot = await prisma.cashPots.findFirst({
    where: {
      id: +cashPotId,
      UserId: this.request.user?.id,
    },
  });

  if (!cashPot) throw new AppError("CashPot not found!");

  cashPot = await prisma.cashPots.update({
    where: {
      id: +cashPotId,
    },
    data: {
      ...body,
      UserId: this.request.user?.id,
    },
  });

  await invalidateCache(`cashPot_${cashPot.id}`);
  return cashPot;
}
