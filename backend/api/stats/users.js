import { AppError } from "../../utils/AppError.js";
import { prisma, Models } from "../../utils/prisma.js";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$post("/investment_profiles", setUsersStats);
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
            (SELECT * FROM "Revenus" WHERE "UserId" = ${investment_profile.user_id}  ORDER BY "createdAt" DESC LIMIT 6) as revenus;`;

        await prisma.investment_profile.update({
          where: {
            id: +investment_profile_id,
          },
          data: {
            average_revenu_pro: revenu_stats.average_pro,
            average_revenu_perso: revenu_stats.average_perso,
            average_revenu_total: revenu_stats.average_total,
            average_expense: revenu_stats.average_expense,
            average_balance: revenu_stats.average_balance,
            average_investments: revenu_stats.average_investments,
            investment_capacity: investment_profile.withholding_tax_active
              ? revenu_stats.average_balance - revenu_stats.average_tax_amount
              : revenu_stats.average_balance,
          },
        });
      } catch (error) {
        console.log("An unexpected error occured", error);
      }
    }
  } else {
    throw new AppError("Body not supported");
  }
}
