import { generateTaxProfileStats } from "../../utils/generateStats.js";
import { getOrSetCache, invalidateCache } from "../../utils/cacheManager.js";
import { prisma, Models } from "../../utils/prisma.js";
import { AppError } from "../../utils/AppError.js";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$get("/tax-profiles", getTaxProfile);
  app.$put("/tax-profiles/:id", updateTaxProfile);
  app.$post("/tax-profiles/:id/simulate", simulateTaxProfile);
}

/**
 * @this {API.This}
 * @returns {Promise<Models.tax_profile>}
 */
export async function getTaxProfile() {
  let error;
  const tax_profile = await getOrSetCache(`user_${this.request.user?.id}_tax_profile`, async () => {
    try {
      const tax_profile = await prisma.tax_profile.findFirst({
        where: {
          user_id: this.request.user?.id || null,
        },
      });

      if (!tax_profile) throw new AppError("Tax profile not found!");

      return tax_profile;
    } catch (err) {
      error = err;
      throw new Error(err);
    }
  });

  if (error) {
    throw new Error(`An expected error occured: ${error}`);
  }

  if (!tax_profile) throw new AppError("Tax not found!");

  return tax_profile;
}

/**
 * @this {API.This}
 * @param {string} tax_profile_id
 * @param {Models.Prisma.tax_profileUncheckedUpdateInput} body
 * @returns {Promise<Models.tax_profile>}
 */
export async function updateTaxProfile(tax_profile_id, body) {
  let tax_profile = await prisma.tax_profile.findFirst({
    where: {
      id: +tax_profile_id,
      user_id: this.request.user?.id || null,
    },
  });

  if (!tax_profile) throw new AppError("Tax profile not found!");

  tax_profile = await prisma.tax_profile.update({
    where: {
      id: +tax_profile_id,
    },
    data: {
      withholding_tax_active: body.withholding_tax_active,
      deduction_percent: body.deduction_percent,
      fees_declared: body.fees_declared,
      parts_number: body.parts_number,
    },
  });

  await invalidateCache(`user_${this.request.user?.id}_tax_profile`);
  return tax_profile;
}

/**
 * @this {API.This}
 * @param {string} tax_profile_id
 * @param {Models.tax_profile} body
 * @returns {Promise<Models.tax_profile>}
 */
export async function simulateTaxProfile(tax_profile_id, body) {
  let tax_profile = await prisma.tax_profile.findFirst({
    where: {
      id: +tax_profile_id,
      user_id: this.request.user?.id || null,
    },
  });

  if (!tax_profile) throw new AppError("Tax profile not found!");

  const new_stats = await generateTaxProfileStats(body, true);
  return {
    ...tax_profile,
    ...new_stats,
  };
}
