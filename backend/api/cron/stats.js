import { invalidateCache } from "../../utils/cacheManager.js";
import { AppError } from "../../utils/AppError.js";
import { prisma } from "../../utils/prisma.js";
import { roundTo } from "../../utils/roundTo.js";
/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$post("/stats/investment-profiles", setUsersStats);
  app.$post("/stats/assets", setAssetsStats);
}

/**
 * @this {API.This & { request: { body: { investmentProfileIds: Number[]}}}}
 */
export async function setUsersStats() {
  const investmentProfileIds = this.request.body.investmentProfileIds;
  if (investmentProfileIds?.length) {
    for (let investment_profile_id of investmentProfileIds) {
      try {
        const investment_profile = await prisma.investment_profile.findFirst({
          select: {
            id: true,
            user_id: true,
          },
          where: {
            id: +investment_profile_id,
          },
        });

        if (!investment_profile) console.error("Investment profile not found for id #", investment_profile.id);

        const [revenu_stats] = await prisma.$queryRaw`
          SELECT
            COALESCE(AVG(pro), 0) as average_pro,
            COALESCE(AVG(perso), 0) as average_perso,
            COALESCE(AVG(total), 0) as average_total,
            COALESCE(AVG(expense), 0) as average_expense,
            COALESCE(AVG(balance), 0) as average_balance,
            COALESCE(AVG(investments), 0) as average_investments,
            COALESCE(AVG(tax_amount), 0) as average_tax_amount
          FROM
            (SELECT * FROM "Revenus" WHERE "UserId" = ${investment_profile.user_id}  ORDER BY "created_at" DESC LIMIT 6) as revenus;`;

        await prisma.investment_profile.update({
          where: {
            id: +investment_profile_id,
          },
          data: {
            average_revenu_pro: roundTo(revenu_stats.average_pro, 2),
            average_revenu_perso: roundTo(revenu_stats.average_perso, 2),
            average_revenu_total: roundTo(revenu_stats.average_total, 2),
            average_expense: roundTo(revenu_stats.average_expense, 2),
            average_balance: roundTo(revenu_stats.average_balance, 2),
            average_investments: roundTo(revenu_stats.average_investments, 2),
            investment_capacity: investment_profile.withholding_tax_active
              ? roundTo(revenu_stats.average_balance - revenu_stats.average_tax_amount, 2)
              : roundTo(revenu_stats.average_balance, 2),
          },
        });

        await invalidateCache(`user_${this.request.user?.id}_investment_profile`);
      } catch (error) {
        console.log("An unexpected error occured", error);
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
                (SELECT SUM(costs.total)
                FROM "Costs" costs
                WHERE costs.asset_id = asset.id
                AND costs."created_at" >= asset.updated_at), 0) as sum_costs_since_last_updated_at,
              COALESCE(
                (SELECT SUM(credits.total)
                FROM "Credits" credits
                WHERE credits.asset_id = asset.id
                AND credits."created_at" >= asset.updated_at), 0) as sum_credits_since_last_updated_at,
              COALESCE(
                (SELECT SUM(costs.total)
                FROM "Costs" costs
                WHERE costs.asset_id = asset.id
                AND costs."created_at" >= NOW() - INTERVAL '1 month'), 0) as sum_costs_last_month,
              COALESCE(
                (SELECT SUM(credits.total)
                FROM "Credits" credits
                WHERE credits.asset_id = asset.id
                AND credits."created_at" >= NOW() - INTERVAL '1 month'), 0) as sum_credits_last_month,
              COALESCE(
                (SELECT SUM(costs.total)
                FROM "Costs" costs
                WHERE costs.asset_id = asset.id
                AND costs."created_at" >= NOW() - INTERVAL '6 month'), 0) as sum_costs_last_six_months,
              COALESCE(
                (SELECT SUM(credits.total)
                FROM "Credits" credits
                WHERE credits.asset_id = asset.id
                AND credits."created_at" >= NOW() - INTERVAL '6 month'), 0) as sum_credits_last_six_months,
              COALESCE(
                (SELECT SUM(costs.total)
                FROM "Costs" costs
                WHERE costs.asset_id = asset.id
                AND costs."created_at" >= NOW() - INTERVAL '1 year'), 0) as sum_costs_last_year,
              COALESCE(
                (SELECT SUM(credits.total)
                FROM "Credits" credits
                WHERE credits.asset_id = asset.id
                AND credits."created_at" >= NOW() - INTERVAL '1 year'), 0) as sum_credits_last_year
            FROM asset
            WHERE id = ${asset.id}`;

        const current_amount =
          asset_stats.amount +
          asset_stats.sum_costs_since_last_updated_at +
          asset_stats.sum_credits_since_last_updated_at;
        const amount_last_month =
          asset_stats.amount + asset_stats.sum_costs_last_month + asset_stats.sum_credits_last_month;
        const amount_six_months_ago =
          asset_stats.amount + asset_stats.sum_costs_last_six_months + asset_stats.sum_credits_last_six_months;
        const amount_last_year =
          asset_stats.amount + asset_stats.sum_costs_last_year + asset_stats.sum_credits_last_year;

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

        await invalidateCache(`user_${this.request.user?.id}_assets`);
      } catch (error) {
        console.log("An unexpected error occured", error);
      }
    }
  } else {
    throw new AppError("Body not supported");
  }
}
