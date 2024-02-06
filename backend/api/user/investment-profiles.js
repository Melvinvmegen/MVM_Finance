import { getOrSetCache, invalidateCache } from "../../utils/cacheManager.js";
import { AppError } from "../../utils/AppError.js";
import { prisma, Models } from "../../utils/prisma.js";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$get("/investment-profiles", getInvestmentProfile);
  app.$put("/investment-profiles/:id", updateInvestmentProfile);
}

/**
 * @this {API.This}
 * @returns {Promise<Models.investment_profile>}
 */
export async function getInvestmentProfile() {
  let error;
  const investment_profile = await getOrSetCache(`user_${this.request.user?.id}_investment_profile`, async () => {
    try {
      const investment_profile = await prisma.investment_profile.findFirst({
        where: {
          user_id: this.request.user?.id || null,
        },
      });

      if (!investment_profile) throw new AppError("Investment profile not found!");

      return investment_profile;
    } catch (err) {
      error = err;
      throw new Error(err);
    }
  });

  if (error) {
    throw new Error(`An expected error occured: ${error}`);
  }

  if (!investment_profile) throw new AppError("InvestmentProfile not found!");

  return investment_profile;
}

/**
 * @this {API.This}
 * @param {string} investment_profile_id
 * @param {Models.Prisma.investment_profileUncheckedUpdateInput} body
 * @returns {Promise<Models.investment_profile>}
 */
export async function updateInvestmentProfile(investment_profile_id, body) {
  let investment_profile = await prisma.investment_profile.findFirst({
    where: {
      id: +investment_profile_id,
      user_id: this.request.user?.id || null,
    },
  });

  if (!investment_profile) throw new AppError("InvestmentProfile not found!");

  investment_profile = await prisma.investment_profile.update({
    where: {
      id: +investment_profile_id,
    },
    data: {
      withholding_tax_active: body.withholding_tax_active,
      investment_goal: body.investment_goal,
    },
  });

  await invalidateCache(`user_${this.request.user?.id}_investment_profile`);
  return investment_profile;
}
