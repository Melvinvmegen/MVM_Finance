import { updateCreateOrDestroyChildItems } from "../../utils/childItemsHandler.js";
import { getOrSetCache, invalidateCache } from "../../utils/cacheManager.js";
import { setFilters } from "../../utils/filter.js";
import { AppError } from "../../utils/AppError.js";
import { prisma, Models } from "../../utils/prisma.js";
import { parse } from "csv-parse";
import dayjs from "dayjs";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$get("/revenus", getRevenus);
  app.$get("/revenus/ids", getRevenuIds);
  app.$get("/revenus/:id", getRevenu);
  app.$upload("/revenus/:bankId", createRevenu);
  app.$put("/revenus/:id", updateRevenu);
  app.$post("/revenus/:id/costs/:CostId", updateOrCreateRevenuCost);
  app.$post("/revenus/:id/withdrawals", createRevenuWithdrawal);
  app.$get("/revenus/categories", getCategories);
}

/**
 * @this {API.This}
 * @param {{ per_page: number, offset: number, force: string, options: any }} params
 * @returns {Promise<{ count: number, rows:Models.Revenus[], Withdrawals: Models.Withdrawals, Invoices: Models.Invoices, Credits: Models.Credits, Costs: Models.Costs, Quotations: Models.Quotations, Transactions: Models.Transactions} }>}
 */
export async function getRevenus(params) {
  const { per_page, offset, orderBy, options } = setFilters(params);
  const force = params.force === "true";
  const cacheName =
    per_page == 1 ? `user_${this.request.user?.id}_dashboard_revenu` : `user_${this.request.user?.id}_revenus`;
  const revenus = await getOrSetCache(
    cacheName,
    async () => {
      const count = await prisma.revenus.count();
      const rows = await prisma.revenus.findMany({
        where: {
          ...options,
          UserId: this.request.user?.id || null,
        },
        take: per_page,
        skip: offset,
        orderBy: orderBy || { createdAt: "desc" },
        include: {
          Credits: {
            select: {
              createdAt: true,
              CreditCategoryId: true,
              total: true,
            },
          },
          Costs: {
            select: {
              CostCategoryId: true,
              createdAt: true,
              recurrent: true,
              total: true,
              tvaAmount: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      return { rows, count };
    },
    force
  );

  return revenus;
}

/**
 * @this {API.This}
 * @returns {Promise<Models.Revenus[]>}
 */
export async function getRevenuIds() {
  const revenus = await getOrSetCache(`user_${this.request.user?.id}_revenuIds`, async () => {
    return await prisma.revenus.findMany({
      where: {
        UserId: this.request.user?.id || null,
      },
      select: {
        id: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  });

  return revenus;
}

/**
 * @this {API.This}
 * @param {string} revenuId
 * @returns {Promise<Models.Revenus[] & { Invoices: Models.Invoices, Credits: Models.Credits, Costs: Models.Costs, Quotations: Models.Quotations, Transactions: Models.Transactions}>}
 */
export async function getRevenu(revenuId) {
  const revenu = await getOrSetCache(`user_${this.request.user?.id}_revenu_${revenuId}`, async () => {
    return await prisma.revenus.findUnique({
      where: {
        id: +revenuId,
        UserId: this.request.user?.id || null,
      },
      include: {
        Invoices: true,
        Quotations: true,
        Transactions: true,
        Credits: {
          orderBy: {
            createdAt: "asc",
          },
        },
        Costs: {
          orderBy: {
            createdAt: "asc",
          },
        },
        Withdrawals: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  });

  return revenu;
}

let cost_category_cache = {};
let credit_category_cache = {};

/**
 * @this {API.This}
 * @param {string} bankId
 * @param {API.UploadData} upload
 */
// TODO: Prisma transaction
export async function createRevenu(bankId, upload) {
  const bank = await prisma.banks.findFirst({
    where: {
      UserId: this.request.user?.id || null,
      id: +bankId,
    },
  });

  if (!bank) throw new AppError(401, "Bank not found!");
  if (!upload.mimetype.includes("csv")) throw new AppError("Please upload a CSV file!");
  let revenu;
  const costs = [];
  const credits = [];
  const revenus = [];

  upload.file
    .pipe(parse({ delimiter: ",", from_line: 5 }))
    .on("data", (row) => {
      const total = +row[5] ? +`${row[4]}.${row[5]}` : +row[4];
      const [day, month, year] = row[0].trim().split("/");
      const date = dayjs(`${year}-${month}-${day}`).toDate();
      const name = row[2];
      if (total < 0) {
        costs.push({
          createdAt: date,
          updatedAt: date,
          name,
          total,
        });
      } else {
        credits.push({
          createdAt: date,
          updatedAt: date,
          reason: name,
          creditor: name,
          total,
        });
      }
    })
    .on("end", async () => {
      for (let obj of [...costs, ...credits]) {
        const createdAt = dayjs(obj.createdAt);
        const beginningOfMonth = createdAt.startOf("month").toDate();
        const endOfMonth = createdAt.endOf("month").toDate();
        revenu = await prisma.revenus.findFirst({
          where: {
            createdAt: {
              gte: beginningOfMonth,
              lte: endOfMonth,
            },
            UserId: +this.request.user.id,
          },
          include: {
            Costs: true,
            Credits: true,
          },
        });

        if (!revenu) {
          revenu = await prisma.revenus.create({
            data: {
              createdAt: beginningOfMonth,
              updatedAt: beginningOfMonth,
              UserId: +this.request.user.id,
            },
            include: {
              Costs: true,
              Credits: true,
            },
          });
        }

        const name = (obj.name || obj.reason).replace(/[\d+/+]/g, "").trim();
        const newObj = {
          ...obj,
          RevenuId: revenu.id,
        };

        if (obj.total < 0) {
          const cost_category = cost_category_cache[name];
          if (cost_category) {
            newObj.CostCategoryId = cost_category.CostCategoryId;
            newObj.recurrent = cost_category.recurrent;
          } else {
            const previousCost = await prisma.costs.findFirst({
              orderBy: { createdAt: "desc" },
              select: {
                CostCategoryId: true,
                recurrent: true,
              },
              where: {
                BankId: +bankId,
                name: {
                  contains: name,
                },
              },
            });

            if (previousCost) {
              cost_category_cache[name] = {
                CostCategoryId: previousCost.CostCategoryId,
                recurrent: previousCost.recurrent,
              };
            }
          }

          let cost = await prisma.costs.findFirst({
            where: {
              name: obj.name,
              total: obj.total,
              RevenuId: revenu.id,
            },
          });

          if (cost) {
            cost = await prisma.costs.update({
              where: {
                id: cost.id,
              },
              data: {
                ...newObj,
                BankId: +bankId,
              },
            });
          } else {
            cost = await prisma.costs.create({
              data: {
                ...newObj,
                BankId: +bankId,
              },
            });
          }
          revenu.Costs.push(cost);
        } else {
          let credit_category = credit_category_cache[name];
          if (credit_category) {
            newObj.CreditCategoryId = credit_category.CreditCategoryId;
          } else {
            const previousCredit = await prisma.credits.findFirst({
              orderBy: { createdAt: "desc" },
              select: {
                CreditCategoryId: true,
              },
              where: {
                creditor: {
                  contains: name,
                },
                BankId: +bankId,
              },
            });
            if (previousCredit) {
              credit_category = {
                CreditCategoryId: previousCredit.CreditCategoryId,
              };
            }
          }

          let credit = await prisma.credits.findFirst({
            where: {
              creditor: obj.creditor,
              total: obj.total,
              RevenuId: revenu.id,
            },
          });
          if (credit) {
            credit = await prisma.credits.update({
              where: {
                id: credit.id,
              },
              data: {
                ...newObj,
                BankId: +bankId,
              },
            });
          } else {
            credit = await prisma.credits.create({
              data: {
                ...newObj,
                BankId: +bankId,
              },
            });
          }
          revenu.Credits.push(credit);
        }

        const revenuIndex = revenus.findIndex((i) => i.id == revenu.id);
        if (revenuIndex > -1) {
          revenus[revenuIndex] = revenu;
        } else {
          revenus.push(revenu);
        }
      }

      for (let revenu of revenus) {
        const revenuUpdated = updateRevenuStats(revenu, this.request.user);
        revenu = await prisma.revenus.update({
          where: {
            id: revenu.id,
          },
          data: revenuUpdated,
        });

        await invalidateCache(`user_${this.request.user?.id}_revenu_${revenu.id}`);
      }

      await invalidateCache(`user_${this.request.user?.id}_revenus`);
      await invalidateCache(`user_${this.request.user?.id}_dashboard_revenu`);
    })
    .on("error", (error) => {
      throw error;
    });
}

/**
 * @this {API.This}
 * @param {number} revenuId
 * @param {Models.Prisma.RevenusUncheckedUpdateInput & {Credits: Models.Credits[], Costs: Models.Costs[], Invoices: Models.Invoices[], Quotations: Models.Quotations[], Transactions: Models.Transactions[], Withdrawals: Models.Withdrawal[]}} body
 * @returns {Promise<Models.Revenus & {Credits: Models.Credits[], Costs: Models.Costs[]}>}
 */
export async function updateRevenu(revenuId, body) {
  const { Credits, Costs, Quotations, Transactions, Invoices, Withdrawals, id, ...revenuBody } = body;
  let revenu = await prisma.revenus.findUnique({
    where: {
      id: +revenuId,
      UserId: this.request.user?.id || null,
    },
    include: {
      Credits: true,
      Costs: true,
      Withdrawals: true,
    },
  });

  if (!revenu) throw new AppError(401, "Revenu not found!");

  if (Credits) {
    await updateCreateOrDestroyChildItems("Credits", revenu.Credits, Credits);
  }
  if (Costs) {
    await updateCreateOrDestroyChildItems("Costs", revenu.Costs, Costs);
  }
  if (Withdrawals) {
    await updateCreateOrDestroyChildItems("Withdrawal", revenu.Withdrawals, Withdrawals);
  }

  const revenuUpdated = updateRevenuStats(
    {
      ...revenuBody,
      Credits: Credits,
      Costs: Costs,
      Invoices: Invoices,
    },
    this.request.user
  );

  revenu = await prisma.revenus.update({
    where: {
      id: +revenuId,
    },
    data: {
      ...revenuUpdated,
      watchers: [revenuBody.watchers].join(),
    },
    include: {
      Credits: true,
      Costs: true,
      Withdrawals: true,
    },
  });

  await invalidateCache(`user_${this.request.user?.id}_revenus`);
  await invalidateCache(`user_${this.request.user?.id}_revenu_${revenu?.id}`);
  return revenu;
}

/**
 * @this {API.This}
 * @param {string} RevenuId
 * @param {string} CostId
 * @param {Models.Prisma.CostsUncheckedUpdateInput | Models.Prisma.CostsUncheckedCreateInput} body
 * @returns {Promise<Models.Costs>}
 */
export async function updateOrCreateRevenuCost(RevenuId, CostId, body) {
  let cost;
  if (CostId && CostId !== "undefined") {
    cost = await prisma.costs.findFirst({
      where: {
        id: +CostId,
        RevenuId: +RevenuId,
      },
    });

    if (!cost) throw new AppError("Cost not found!");

    cost = await prisma.costs.update({
      where: {
        id: +CostId,
      },
      data: {
        paymentMean: body.paymentMean,
        BankId: body.BankId,
        CashPotId: body.CashPotId,
      },
    });
  } else {
    cost = await prisma.costs.create({
      data: {
        createdAt: dayjs(body.createdAt).toDate(),
        name: "" + body.name,
        total: +body.total,
        tvaAmount: +body.tvaAmount,
        recurrent: !!body.recurrent,
        paymentMean: "" + body.paymentMean,
        CostCategoryId: +body.CostCategoryId,
        RevenuId: +RevenuId,
        BankId: +body.BankId,
        CashPotId: +body.CashPotId,
      },
    });
  }

  await invalidateCache(`user_${this.request.user?.id}_revenus`);
  await invalidateCache(`user_${this.request.user?.id}_revenu_${RevenuId}`);
  return cost;
}

/**
 * @this {API.This}
 * @param {string} RevenuId
 * @param {Models.Prisma.WithdrawalUncheckedCreateInput & {BankId: number, CashPotId: number, CostId: number, CreditId: number}} body
 * @returns {Promise<{ withdrawal: Models.Withdrawal, cost: Models.Costs, credit: Models.Credits }>}
 */
// TODO: Prisma transaction
export async function createRevenuWithdrawal(RevenuId, body) {
  let revenu = await prisma.revenus.findFirst({
    where: {
      id: +RevenuId,
      UserId: this.request.user.id,
    },
  });

  if (!revenu) throw new AppError("Revenu not found!");

  const withdrawal = await prisma.withdrawal.create({
    data: {
      date: dayjs(body.date).toDate(),
      name: body.name,
      amount: +body.amount,
      exchangeFees: +body.exchangeFees,
      RevenuId: +RevenuId,
    },
  });

  const credit = await prisma.credits.create({
    data: {
      creditor: withdrawal.name,
      total: withdrawal.amount + withdrawal.exchangeFees,
      RevenuId: withdrawal.RevenuId,
      WithdrawalId: withdrawal.id,
      CreditCategoryId: 14,
      BankId: +body.BankId,
      CashPotId: +body.CashPotId,
    },
  });

  const cost = await prisma.costs.update({
    where: {
      id: body.CostId,
    },
    data: {
      WithdrawalId: withdrawal.id,
      CostCategoryId: 9,
      BankId: +body.BankId,
      CashPotId: +body.CashPotId,
    },
  });

  await invalidateCache(`user_${this.request.user?.id}_revenus`);
  await invalidateCache(`user_${this.request.user?.id}_revenu_${RevenuId}`);
  return { withdrawal, cost, credit };
}

export async function getCategories() {
  const cost_categories = await prisma.cost_category.findMany({
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
    },
  });
  const credit_categories = await prisma.credit_category.findMany({
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
    },
  });

  return { cost_categories, credit_categories };
}

/**
 * @param {Models.Prisma.RevenusUncheckedUpdateInput & {Credits: Models.Credits[], Costs: Models.Costs[], Invoices: Models.Invoices[]}} revenu
 * @param {API.LoggedUser} user
 * @returns {Models.Prisma.RevenusUncheckedUpdateInput & {Credits: Models.Credits[], Costs: Models.Costs[], Invoices: Models.Invoices[]}}
 */
function updateRevenuStats(revenu, user) {
  let pro = 0;
  let perso = 0;
  let expense = 0;
  let refund = 0;
  let tva_collected = 0;
  let tva_dispatched = 0;
  let total_costs = 0;
  let total_credits = 0;
  let recurrent_costs = 0;
  let recurrent_credits = 0;
  let investments = 0;
  if (revenu.Credits) {
    for (let credit of revenu.Credits) {
      total_credits += +credit.total;
      if (credit.CreditCategoryId === 6) continue;
      if (credit.CreditCategoryId === 10) {
        pro += +credit.total;
      } else if (credit.CreditCategoryId === 8) {
        refund += +credit.total;
      } else if (credit.CreditCategoryId !== 10) {
        perso += +credit.total;
      }

      if (credit.recurrent) {
        recurrent_credits += credit.total;
      }
    }
  }

  if (revenu.Costs) {
    for (let cost of revenu.Costs) {
      total_costs += +cost.total;
      if (cost.CostCategoryId === 15) continue;
      if (cost.tvaAmount) {
        tva_dispatched += +cost.tvaAmount;
      }

      if (cost.recurrent) {
        recurrent_costs += cost.total;
      }

      if (cost.CostCategoryId === 19) {
        investments += cost.total;
      }

      expense += +cost.total;
    }
  }

  if (revenu.Invoices) {
    for (let invoice of revenu.Invoices) {
      if (invoice.tvaAmount) {
        tva_dispatched += +invoice.tvaAmount;
      }
    }
  }

  revenu.pro = pro || 0;
  revenu.perso = perso || 0;
  revenu.total = pro + perso || 0;
  revenu.expense = expense || 0;
  revenu.refund = refund || 0;
  revenu.tva_collected = tva_collected || 0;
  revenu.tva_dispatched = tva_dispatched || 0;
  revenu.tva_balance = tva_collected - tva_dispatched || 0;
  revenu.total_costs = total_costs || 0;
  revenu.total_credits = total_credits || 0;
  revenu.recurrent_costs = recurrent_costs || 0;
  revenu.recurrent_credits = recurrent_credits || 0;
  revenu.average_costs = expense / revenu.Costs.length || 0;
  revenu.average_credits = revenu.total / revenu.Credits.length || 0;
  revenu.tax_amount = calculateTaxAmount(revenu.total);
  let total_net = pro || 0;
  if (user.withholding_tax_active) {
    revenu.total_net -= revenu.tax_amount;
  }
  revenu.total_net = total_net || 0;
  revenu.investments = investments || 0;
  revenu.balance = expense + revenu.total || 0;
  delete revenu.id;
  delete revenu.Costs;
  delete revenu.Credits;
  delete revenu.Invoices;

  return revenu;
}

/**
 * @param {Number} total
 */
function calculateTaxAmount(total) {
  // Abattement de 30% avant impots sur le CA
  const taxable_income = total / 1.3;
  // Pas d'impôts jusqu'à 10 225€
  const first_cap = 10226;
  // 11% entre 10 226€ & 26 070€
  const cap_first_batch = 26070;
  // On passe au cap au dessus soit 26 071€
  const second_cap = cap_first_batch + 1;
  // 30 % entre 26 071€ & 74 545€, Au delà faut prendre un comptable sinon ça va chier
  let tax_total = 0;
  if (taxable_income >= first_cap && taxable_income < cap_first_batch) {
    tax_total = (taxable_income - first_cap) * 0.11;
  } else if (taxable_income >= second_cap) {
    const tax_first_batch = (cap_first_batch - first_cap) * 0.11;
    const tax_second_batch = (taxable_income - second_cap) * 0.3;
    tax_total = tax_first_batch + tax_second_batch;
  }

  return Math.round(tax_total);
}
