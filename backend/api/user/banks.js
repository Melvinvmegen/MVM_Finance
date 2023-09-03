import { getOrSetCache, invalidateCache } from "../../utils/cacheManager.js";
import { AppError } from "../../utils/AppError.js";
import { prisma, Models } from "../../utils/prisma.js";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$get("/banks", getBanks);
  app.$get("/banks/:bankId", getBank);
  app.$post("/banks", createBank);
  app.$put("/banks/:bankId", updateBank);
}

/**
 * @this {API.This}
 * @param {{ force: string }} params
 * @returns {Promise<Models.Banks[]>}
 */
export async function getBanks(params) {
  const force = params.force === "true";
  const result = await getOrSetCache(
    "banks",
    async () => {
      const banks = await prisma.banks.findMany({
        where: {
          UserId: this.request?.user?.id,
        },
      });

      return banks;
    },
    force
  );

  return result;
}
/**
 * @this {API.This}
 * @param {number} bankId
 * @returns {Promise<Models.Banks>}
 */
export async function getBank(bankId) {
  const bank = await getOrSetCache(`bank_${bankId}`, async () => {
    const bank = await prisma.banks.findFirst({
      where: {
        id: +bankId,
        UserId: this.request?.user?.id,
      },
    });
    if (!bank) throw new AppError("Bank not found!");
    return bank;
  });

  return bank;
}
/**
 * @this {API.This}
 * @param {Models.Prisma.BanksUncheckedCreateInput} body
 * @returns {Promise<Models.Banks>}
 */
export async function createBank(body) {
  const bank = await prisma.banks.create({
    data: {
      ...body,
      UserId: this.request?.user?.id,
    },
  });
  await invalidateCache("banks");
  return bank;
}

/**
 * @this {API.This}
 * @param {number} bankId
 * @param {Models.Prisma.BanksUncheckedUpdateInput} body
 * @returns
 */

export async function updateBank(bankId, body) {
  let bank = await prisma.banks.findFirst({
    where: {
      id: +bankId,
      UserId: this.request?.user?.id,
    },
  });

  if (!bank) throw new AppError("Bank not found!");

  bank = await prisma.banks.update({
    where: {
      id: +bankId,
    },
    data: {
      ...body,
      UserId: this.request?.user?.id,
    },
  });

  await invalidateCache(`bank_${bank.id}`);
  return bank;
}
