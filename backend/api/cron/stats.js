import { generateTaxProfileStats, generateInvestmentProfileStats } from "../../utils/generateStats.js";
import { invalidateCache } from "../../utils/cacheManager.js";
import { AppError } from "../../utils/AppError.js";
import { prisma } from "../../utils/prisma.js";
import { roundTo } from "../../utils/roundTo.js";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$post("/stats/users", setUsersStats);
  app.$post("/stats/assets", setAssetsStats);
}

/**
 * @this {API.This & { request: { body: { user_ids: Number[]}}}}
 */
export async function setUsersStats() {
  const user_ids = this.request.body.user_ids;
  if (user_ids?.length) {
    for (let user_id of user_ids) {
      try {
        const investment_profile = await prisma.investment_profile.findFirst({
          select: {
            id: true,
            user_id: true,
          },
          where: {
            user_id: +user_id,
          },
        });

        const tax_profile = await prisma.tax_profile.findFirst({
          select: {
            id: true,
            withholding_tax_active: true,
            parts_number: true,
            user_id: true,
          },
          where: {
            user_id: +user_id,
          },
        });

        if (!tax_profile || !investment_profile) console.error("Profile not found for user_id #", user_id);

        if (investment_profile) {
          const updated_investment_profile = await generateInvestmentProfileStats(investment_profile, tax_profile);
          await prisma.investment_profile.update({
            where: {
              user_id: +investment_profile.user_id,
            },
            data: updated_investment_profile,
          });
          await invalidateCache(`user_${this.request.user?.id}_investment_profile`);
        }

        if (tax_profile) {
          const updated_tax_profile = await generateTaxProfileStats(tax_profile);
          await prisma.tax_profile.update({
            where: {
              user_id: +tax_profile.user_id,
            },
            data: updated_tax_profile,
          });
          await invalidateCache(`user_${this.request.user?.id}_tax_profile`);
        }
      } catch (error) {
        console.log("An unexpected error occured", error);
        throw new AppError("An unexpected error occured");
      }
    }
  } else {
    throw new AppError("Body not supported");
  }
}

/**
 * @this {API.This & { request: { body: { assetIds: Number[]}}}}
 */
export async function setAssetsStats() {
  const assetIds = this.request.body.assetIds;
  if (assetIds?.length) {
    for (let asset_id of assetIds) {
      try {
        const asset = await prisma.asset.findFirst({
          select: {
            id: true,
          },
          where: {
            id: +asset_id,
          },
        });

        if (!asset) console.error("Asset not found for id #", asset.id);

        const [asset_stats] = await prisma.$queryRaw`
            SELECT
              asset.name,
              asset.amount,
              COALESCE(
                (SELECT SUM(cost.total)
                FROM cost
                WHERE cost.asset_id = asset.id
                AND cost.created_at >= asset.amount_date), 0) as sum_costs_since_last_updated_at,
              COALESCE(
                (SELECT SUM(credit.total)
                FROM credit
                WHERE credit.asset_id = asset.id
                AND credit.created_at >= asset.amount_date), 0) as sum_credits_since_last_updated_at,
              COALESCE(
                (SELECT SUM(crypto_currency.price) * SUM(tr.quantity)
                FROM crypto_currency
                JOIN "transaction" tr ON tr.crypto_currency_id = crypto_currency.id
                WHERE crypto_currency.asset_id = asset.id
                AND crypto_currency.created_at >= asset.amount_date), 0) as sum_cryptos_since_last_updated_at,
              COALESCE(
                (SELECT SUM(cost.total)
                FROM cost
                WHERE cost.asset_id = asset.id
                AND cost.created_at >= NOW() - INTERVAL '1 month'), 0) as sum_costs_last_month,
              COALESCE(
                (SELECT SUM(credit.total)
                FROM credit
                WHERE credit.asset_id = asset.id
                AND credit.created_at >= NOW() - INTERVAL '1 month'), 0) as sum_credits_last_month,
              COALESCE(
                (SELECT SUM(crypto_currency.price) * SUM(tr.quantity)
                FROM crypto_currency
                JOIN "transaction" tr ON tr.crypto_currency_id = crypto_currency.id
                WHERE crypto_currency.asset_id = asset.id
                AND crypto_currency.created_at >= NOW() - INTERVAL '1 month'), 0) as sum_cryptos_last_month,
              COALESCE(
                (SELECT SUM(cost.total)
                FROM cost
                WHERE cost.asset_id = asset.id
                AND cost.created_at >= NOW() - INTERVAL '6 month'), 0) as sum_costs_last_six_months,
              COALESCE(
                (SELECT SUM(credit.total)
                FROM credit
                WHERE credit.asset_id = asset.id
                AND credit.created_at >= NOW() - INTERVAL '6 month'), 0) as sum_credits_last_six_months,
              COALESCE(
                (SELECT SUM(crypto_currency.price) * SUM(tr.quantity)
                FROM crypto_currency
                JOIN "transaction" tr ON tr.crypto_currency_id = crypto_currency.id
                WHERE crypto_currency.asset_id = asset.id
                AND crypto_currency.created_at >= NOW() - INTERVAL '6 month'), 0) as sum_cryptos_last_six_months,
              COALESCE(
                (SELECT SUM(cost.total)
                FROM cost
                WHERE cost.asset_id = asset.id
                AND cost.created_at >= NOW() - INTERVAL '1 year'), 0) as sum_costs_last_year,
              COALESCE(
                (SELECT SUM(credit.total)
                FROM credit
                WHERE credit.asset_id = asset.id
                AND credit.created_at >= NOW() - INTERVAL '1 year'), 0) as sum_credits_last_year,
              COALESCE(
                (SELECT SUM(crypto_currency.price) * SUM(tr.quantity)
                FROM crypto_currency
                JOIN "transaction" tr ON tr.crypto_currency_id = crypto_currency.id
                WHERE crypto_currency.asset_id = asset.id
                AND crypto_currency.created_at >= NOW() - INTERVAL '1 year'), 0) as sum_cryptos_last_year
            FROM asset
            WHERE id = ${asset.id}`;

        const current_amount =
          asset_stats.amount +
          asset_stats.sum_costs_since_last_updated_at +
          asset_stats.sum_credits_since_last_updated_at;
        const amount_last_month =
          asset_stats.amount - asset_stats.sum_costs_last_month - asset_stats.sum_credits_last_month;
        const amount_six_months_ago =
          asset_stats.amount - asset_stats.sum_costs_last_six_months - asset_stats.sum_credits_last_six_months;
        const amount_last_year =
          asset_stats.amount - asset_stats.sum_costs_last_year - asset_stats.sum_credits_last_year;

        await prisma.asset.update({
          where: {
            id: +asset_id,
          },
          data: {
            amount: current_amount,
            amount_date: new Date(),
            growth_last_month: roundTo(
              ((current_amount - amount_last_month) / Math.max(amount_last_month, 1)) * 100,
              2
            ),
            growth_last_six_months: roundTo(
              ((current_amount - amount_six_months_ago) / Math.max(amount_six_months_ago, 1)) * 100,
              2
            ),
            growth_last_year: roundTo(((current_amount - amount_last_year) / Math.max(amount_last_year, 1)) * 100, 2),
          },
        });
      } catch (error) {
        console.log("An unexpected error occured", error);
        throw new AppError("An unexpected error occured");
      }
    }

    await invalidateCache(`user_${this.request.user?.id}_assets`);
  } else {
    throw new AppError("Body not supported");
  }
}
