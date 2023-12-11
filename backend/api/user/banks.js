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
  app.$get("/banks/account-types", getAccountTypes);
}

/**
 * @this {API.This}
 * @param {{ force: string }} params
 * @returns {Promise<Models.Banks[]>}
 */
export async function getBanks(params) {
  const force = params.force === "true";
  const result = await getOrSetCache(
    `user_${this.request.user?.id}_banks`,
    async () => {
      const banks = await prisma.$queryRaw`
        SELECT
          account_type.*,
          account_type.name as "account_type_name",
          banks.id,
          banks.amount,
          banks.name,
          banks."amountDate",
          banks."AccountTypeId",
          COALESCE(
              (SELECT SUM(costs.total)
              FROM "Costs" costs
              WHERE costs."BankId" = banks.id
              AND costs."paymentMean" = 'CARD'
              AND costs."createdAt" >= banks."amountDate"), 0) as sum_costs,
          COALESCE(
              (SELECT SUM(credits.total)
              FROM "Credits" credits
              WHERE credits."BankId" = banks.id
              AND credits."CreditCategoryId" <> 15
              AND credits."createdAt" >= banks."amountDate"), 0) as sum_credits
        FROM
          "Banks" as banks
        JOIN "Users" as users ON users.id = banks."UserId"
        JOIN "AccountType" as account_type ON account_type.id = banks."AccountTypeId"
        WHERE
          users.id = ${this.request.user?.id}
        ORDER BY banks.amount DESC`;

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
  const bank = await getOrSetCache(`user_${this.request.user?.id}_bank_${bankId}`, async () => {
    const bank = await prisma.banks.findFirst({
      where: {
        id: +bankId,
        UserId: this.request.user?.id || null,
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
      UserId: this.request.user?.id || null,
    },
  });
  await invalidateCache(`user_${this.request.user?.id}_banks`);
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
      UserId: this.request.user?.id || null,
    },
  });

  if (!bank) throw new AppError("Bank not found!");

  bank = await prisma.banks.update({
    where: {
      id: +bankId,
    },
    data: {
      ...body,
      UserId: this.request.user?.id || null,
    },
  });

  await invalidateCache(`user_${this.request.user?.id}_banks`);
  await invalidateCache(`user_${this.request.user?.id}_bank_${bank.id}`);
  return bank;
}

/**
 * @this {API.This}
 * @returns {Promise<Models.AccountType[]>}
 */
export async function getAccountTypes() {
  const account_types = await getOrSetCache(
    `user_${this.request.user?.id}_account_types`,
    async () => {
      const account_types = await prisma.accountType.findMany({
        orderBy: { createdAt: "desc" },
      });

      return account_types;
    },
    false
  );

  return account_types;
}
