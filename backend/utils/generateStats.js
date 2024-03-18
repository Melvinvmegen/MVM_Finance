import { roundTo } from "./roundTo.js";
import { prisma } from "./prisma.js";
import dayjs from "dayjs";

export async function generateInvestmentProfileStats(investment_profile, tax_profile) {
  const [revenu_stats] = await prisma.$queryRaw`
          SELECT
            COALESCE(AVG(salary) + AVG(bnc_pro), 0) as average_pro,
            COALESCE(AVG(perso), 0) as average_perso,
            COALESCE(AVG(total), 0) as average_total,
            COALESCE(AVG(expense), 0) as average_expense,
            COALESCE(AVG(balance), 0) as average_balance,
            COALESCE(AVG(investments), 0) as average_investments,
            COALESCE(AVG(tax_amount), 0) as average_tax_amount
          FROM
            (SELECT * FROM revenu WHERE user_id = ${investment_profile.user_id}  ORDER BY created_at DESC LIMIT 6) as revenus;`;

  const monthly_investment_capacity = (revenu_stats.average_pro - investment_profile.fees) * 0.35;
  const interest_rate = 4;
  const duration_in_years = 20;
  const investment_capacity = calculateInvestmentCapacity(
    monthly_investment_capacity,
    interest_rate,
    duration_in_years
  );

  return {
    average_revenu_pro: roundTo(revenu_stats.average_pro, 2),
    average_revenu_perso: roundTo(revenu_stats.average_perso, 2),
    average_revenu_total: roundTo(revenu_stats.average_total, 2),
    average_expense: roundTo(revenu_stats.average_expense, 2),
    average_balance: roundTo(revenu_stats.average_balance, 2),
    average_investments: roundTo(revenu_stats.average_investments, 2),
    average_tax_amount: roundTo(revenu_stats.average_tax_amount, 2),
    // TODO: average_fixed_expenses
    monthly_investment_capacity,
    investment_capacity,
  };
}

export async function generateTaxProfileStats(tax_profile, simulate = false) {
  const start_of_year = dayjs().subtract(1, "year").startOf("year").toDate();
  const end_of_year = dayjs().subtract(1, "year").endOf("year").toDate();

  // TODO: allow to declare fees
  let revenu_stats = tax_profile;
  if (!simulate) {
    [revenu_stats] = await prisma.$queryRaw`
    SELECT
      COALESCE(SUM(salary), 0) as salary,
      COALESCE(SUM(salary_net), 0) as salary_net,
      COALESCE(SUM(salary) - SUM(salary_net) + SUM(bnc_pro) - SUM(bnc_net), 0) as fees,
      COALESCE(SUM(bnc_pro), 0) as bnc_pro,
      COALESCE(SUM(bnc_net), 0) as bnc_net,
      COALESCE(SUM(salary) + SUM(bnc_pro), 0) as income_global,
      COALESCE(SUM(salary_net) + SUM(bnc_net), 0) as income_taxable,
      COALESCE(SUM(CASE WHEN withholding_tax_active = true THEN tax_amount ELSE 0 END), 0) as tax_withholded
    FROM
      (SELECT * FROM revenu WHERE user_id = ${tax_profile.user_id} AND created_at > ${start_of_year} AND created_at < ${end_of_year} ORDER BY created_at DESC LIMIT 12) as revenus;`;
  }

  // TODO: income_net_global find what is deductible
  const income_net_global = revenu_stats.income_global;
  const income_taxable = revenu_stats.salary_net + revenu_stats.bnc_net;
  const fiscal_revenu = revenu_stats.salary_net + revenu_stats.bnc_net;

  const { tax_amount, tax_rate_marginal, tax_rate_mean } = calculateTaxAmount(
    revenu_stats.income_taxable,
    tax_profile.parts_number
  );
  const decote = 0; // TODO: calculate
  const tax_amount_net = tax_amount - decote - revenu_stats.tax_withholded;

  return {
    fiscal_revenu: roundTo(fiscal_revenu, 0),
    salary: roundTo(revenu_stats.salary, 0),
    salary_net: roundTo(revenu_stats.salary_net, 0),
    fees: roundTo(revenu_stats.fees, 0),
    bnc_pro: roundTo(revenu_stats.bnc_pro, 0),
    bnc_net: roundTo(revenu_stats.bnc_net, 0),
    income_global: roundTo(revenu_stats.income_global, 0),
    income_net_global: roundTo(income_net_global, 0),
    income_taxable: roundTo(income_taxable, 0),
    tax_amount: roundTo(tax_amount, 0),
    tax_amount_net: roundTo(tax_amount_net, 0),
    tax_withholded: roundTo(revenu_stats.tax_withholded, 0),
    tax_rate_mean: roundTo(tax_rate_mean, 2),
    tax_rate_marginal: roundTo(tax_rate_marginal, 2),
  };
}

/**
 * @param {Number} income
 * @param {Number} parts_number
 */
function calculateTaxAmount(income, parts_number) {
  const taxable_income = income / parts_number;
  // Pas d'impôts jusqu'à 11294€
  const first_cap = 11294;
  // 11% entre 11295 & 28797€
  const second_cap = 28797;
  // 30 % entre 28797€ & 82341€, Au delà faut prendre un comptable sinon ça va chier
  const third_cap = 82341;
  // 41% entre 82341€ & 177106€
  const fourth_cap = 177106;
  // 45% plus de 177106€

  let tax_total = 0;
  let tax_rate_marginal = 0;
  if (taxable_income >= first_cap && taxable_income < second_cap) {
    tax_rate_marginal = 0.11;
    tax_total = (taxable_income - first_cap) * 0.11;
  } else if (taxable_income >= second_cap && taxable_income < third_cap) {
    tax_rate_marginal = 0.3;
    const tax_first_slice = (second_cap - first_cap) * 0.11;
    const tax_second_slice = (taxable_income - second_cap) * 0.3;
    tax_total = tax_first_slice + tax_second_slice;
  } else if (taxable_income >= third_cap && taxable_income < fourth_cap) {
    tax_rate_marginal = 0.41;
    const tax_first_slice = (second_cap - first_cap) * 0.11;
    const tax_second_slice = (third_cap - second_cap) * 0.3;
    const tax_third_slice = (taxable_income - third_cap) * 0.41;
    tax_total = tax_first_slice + tax_second_slice + tax_third_slice;
  } else if (taxable_income >= fourth_cap) {
    tax_rate_marginal = 0.45;
    const tax_first_slice = (second_cap - first_cap) * 0.11;
    const tax_second_slice = (third_cap - second_cap) * 0.3;
    const tax_third_slice = (third_cap - third_cap) * 0.41;
    const tax_fourth_slice = (taxable_income - fourth_cap) * 0.45;
    tax_total = tax_first_slice + tax_second_slice + tax_third_slice + tax_fourth_slice;
  }

  const tax_amount = Math.round(tax_total * parts_number) || 0;
  const tax_rate_mean = tax_amount / taxable_income || 0;
  return { tax_amount, tax_rate_marginal, tax_rate_mean };
}

function calculateInvestmentCapacity(monthly_investment_capacity, interest_rate, duration_in_years) {
  const annual_capacity = monthly_investment_capacity * 12;
  const payments_number = duration_in_years * 12;
  const annual_interest_rate = interest_rate / 100;
  return (annual_capacity * (1 - Math.pow(1 + annual_interest_rate, -payments_number))) / annual_interest_rate;
}
