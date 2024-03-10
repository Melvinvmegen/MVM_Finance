import { updateCreateOrDestroyChildItems } from "../../utils/childItemsHandler.js";
import { getOrSetCache, invalidateCache } from "../../utils/cacheManager.js";
import { setFilters } from "../../utils/filter.js";
import { AppError } from "../../utils/AppError.js";
import { prisma, Models } from "../../utils/prisma.js";
import { ExcelService } from "../../utils/excelService.js";
import { parse } from "csv-parse";
import dayjs from "dayjs";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$get("/revenus", getRevenus);
  app.$get("/revenus/ids", getRevenuIds);
  app.$get("/revenus/:id", getRevenu);
  app.$upload("/revenus/:asset_id", createRevenu);
  app.$put("/revenus/:id", updateRevenu);
  app.$post("/revenus/:id/costs/:cost_id", updateOrCreateRevenuCost);
  app.$post("/revenus/:id/withdrawals", createRevenuWithdrawal);
  app.$get("/revenus/categories", getCategories);
  app.$download("/revenus/import-sample", downloadSample);
}

/**
 * @this {API.This}
 * @param {{ per_page: number, offset: number, force: string, options: any }} params
 * @returns {Promise<{ count: number, rows: Models.revenu[], withdrawals: Models.withdrawal[], invoices: Models.invoice[], credits: Models.credit[], costs: Models.cost[], quotations: Models.quotation[], transactions: Models.transaction[]}>}
 */
export async function getRevenus(params) {
  const { per_page, offset, orderBy, options } = setFilters(params);
  const force = params.force === "true";
  const cacheName =
    per_page == 1 ? `user_${this.request.user?.id}_dashboard_revenu` : `user_${this.request.user?.id}_revenus`;
  let error;
  const revenus = await getOrSetCache(
    cacheName,
    async () => {
      try {
        const count = await prisma.revenu.count();
        const rows = await prisma.revenu.findMany({
          where: {
            ...options,
            user_id: this.request.user?.id || null,
          },
          take: per_page,
          skip: offset,
          orderBy: orderBy || { created_at: "desc" },
          include: {
            credits: {
              select: {
                created_at: true,
                credit_category_id: true,
                total: true,
              },
            },
            costs: {
              select: {
                cost_category_id: true,
                created_at: true,
                recurrent: true,
                total: true,
                tva_amount: true,
              },
              orderBy: {
                created_at: "desc",
              },
            },
          },
        });

        return { rows, count };
      } catch (err) {
        console.log("error", err);
        error = err;
        throw new Error(err);
      }
    },
    force
  );

  if (error) {
    throw new Error(`An expected error occured: ${error}`);
  }

  return revenus;
}

/**
 * @this {API.This}
 * @returns {Promise<Models.revenu[]>}
 */
export async function getRevenuIds() {
  let error;
  const revenus = await getOrSetCache(`user_${this.request.user?.id}_revenuIds`, async () => {
    try {
      const revenu = await prisma.revenu.findMany({
        where: {
          user_id: this.request.user?.id || null,
        },
        select: {
          id: true,
          created_at: true,
        },
        orderBy: { created_at: "desc" },
      });

      if (!revenu) throw new AppError("Revenu not found!");

      return revenu;
    } catch (err) {
      error = err;
      throw new Error(err);
    }
  });

  if (error) {
    throw new Error(`An expected error occured: ${error}`);
  }

  return revenus;
}

/**
 * @this {API.This}
 * @param {string} revenuId
 * @returns {Promise<Models.revenu[] & { invoices: Models.invoice[], credits: Models.credit[], costs: Models.cost[], quotations: Models.quotation[], transactions: Models.transaction[]}>}
 */
export async function getRevenu(revenuId) {
  let error;
  const revenu = await getOrSetCache(`user_${this.request.user?.id}_revenu_${revenuId}`, async () => {
    try {
      const revenu = await prisma.revenu.findUnique({
        where: {
          id: +revenuId,
          user_id: this.request.user?.id || null,
        },
        include: {
          invoices: true,
          quotations: true,
          transactions: true,
          credits: {
            orderBy: {
              created_at: "asc",
            },
          },
          costs: {
            orderBy: {
              created_at: "asc",
            },
          },
          withdrawals: {
            orderBy: {
              created_at: "asc",
            },
          },
        },
      });

      if (!revenu) throw new AppError("Revenu not found!");
      return revenu;
    } catch (err) {
      error = err;
      throw new Error(err);
    }
  });

  if (error) {
    throw new Error(`An expected error occured: ${error}`);
  }

  return revenu;
}

let cost_category_cache = {};
let credit_category_cache = {};

/**
 * @this {API.This}
 * @param {string} asset_id
 * @param {API.UploadData} upload
 */
// TODO: Prisma transaction
export async function createRevenu(asset_id, upload) {
  const asset = await prisma.asset.findFirst({
    where: {
      user_id: this.request.user?.id || null,
      id: +asset_id,
    },
  });

  if (!asset) throw new AppError(401, "Asset not found!");
  if (!upload.mimetype.includes("csv")) throw new AppError("Please upload a CSV file!");
  let revenu;
  let inserted = 0;
  let updated = 0;
  let rows = 0;
  const failed = [];
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
          created_at: date,
          updated_at: date,
          name,
          total,
        });
      } else {
        credits.push({
          created_at: date,
          updated_at: date,
          reason: name,
          creditor: name,
          total,
        });
      }
    })
    .on("end", async () => {
      for (let obj of [...costs, ...credits]) {
        rows++;
        const created_at = dayjs(obj.created_at);
        const beginningOfMonth = created_at.startOf("month").toDate();
        const endOfMonth = created_at.endOf("month").toDate();
        revenu = await prisma.revenu.findFirst({
          where: {
            created_at: {
              gte: beginningOfMonth,
              lte: endOfMonth,
            },
            user_id: +this.request.user.id,
          },
          include: {
            costs: true,
            credits: true,
          },
        });

        if (!revenu) {
          revenu = await prisma.revenu.create({
            data: {
              created_at: beginningOfMonth,
              updated_at: beginningOfMonth,
              user_id: +this.request.user.id,
            },
            include: {
              costs: true,
              credits: true,
            },
          });
        }

        const name = (obj.name || obj.reason)
          .replace(/[\d+/+]/g, "")
          .trim()
          .toLowerCase();
        const newObj = {
          ...obj,
          revenu_id: revenu.id,
        };

        if (obj.total < 0) {
          const cost_category = cost_category_cache[name];
          if (cost_category) {
            newObj.cost_category_id = cost_category.cost_category_id;
            newObj.recurrent = cost_category.recurrent;
          } else {
            const previous_cost = await prisma.cost.findFirst({
              orderBy: { created_at: "desc" },
              select: {
                cost_category_id: true,
                recurrent: true,
              },
              where: {
                asset_id: +asset_id,
                name: {
                  contains: name,
                  mode: "insensitive",
                },
              },
            });

            if (previous_cost) {
              cost_category_cache[name] = {
                cost_category_id: previous_cost.cost_category_id,
                recurrent: previous_cost.recurrent,
              };
            }
          }

          let cost = await prisma.cost.findFirst({
            where: {
              name: { contains: name, mode: "insensitive" },
              total: obj.total,
              revenu_id: revenu.id,
              asset_id: obj.asset_id,
              created_at: obj.created_at,
            },
          });

          try {
            if (cost) {
              cost = await prisma.cost.update({
                where: {
                  id: cost.id,
                },
                data: {
                  ...newObj,
                  asset_id: +asset_id,
                },
              });
              updated++;
            } else {
              cost = await prisma.cost.create({
                data: {
                  ...newObj,
                  asset_id: +asset_id,
                },
              });
              inserted++;
            }
            revenu.costs.push(cost);
          } catch (err) {
            console.error(`Cost failed to import with obj : ${obj}`);
            failed.push(obj);
          }
        } else {
          let credit_category = credit_category_cache[name];
          if (credit_category) {
            newObj.credit_category_id = credit_category.credit_category_id;
          } else {
            const previousCredit = await prisma.credit.findFirst({
              orderBy: { created_at: "desc" },
              select: {
                credit_category_id: true,
              },
              where: {
                reason: {
                  contains: name,
                  mode: "insensitive",
                },
                asset_id: +asset_id,
              },
            });
            if (previousCredit) {
              credit_category = {
                credit_category_id: previousCredit.credit_category_id,
              };
            }
          }

          let credit = await prisma.credit.findFirst({
            where: {
              reason: { contains: name, mode: "insensitive" },
              total: obj.total,
              revenu_id: revenu.id,
              asset_id: obj.asset_id,
              created_at: obj.created_at,
            },
          });
          try {
            if (credit) {
              credit = await prisma.credit.update({
                where: {
                  id: credit.id,
                },
                data: {
                  ...newObj,
                  asset_id: +asset_id,
                },
              });
              updated++;
            } else {
              credit = await prisma.credit.create({
                data: {
                  ...newObj,
                  asset_id: +asset_id,
                },
              });
              inserted++;
            }
          } catch (err) {
            console.error(`Credit failed to import with obj : ${obj}`);
            failed.push(obj);
          }
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
        revenu = await prisma.revenu.update({
          where: {
            id: revenu.id,
          },
          data: revenuUpdated,
        });

        await invalidateCache(`user_${this.request.user?.id}_revenu_${revenu.id}`);
      }

      await invalidateCache(`user_${this.request.user?.id}_revenus`);
      await invalidateCache(`user_${this.request.user?.id}_dashboard_revenu`);

      return {
        inserted,
        updated,
        failed,
        rows,
      };
    })
    .on("error", (error) => {
      throw error;
    });
}

/**
 * @this {API.This}
 * @param {number} revenuId
 * @param {Models.Prisma.revenuUncheckedUpdateInput & {credits: Models.credit[], costs: Models.cost[], invoices: Models.invoice[], quotations: Models.quotation[], transactions: Models.transaction[], withdrawals: Models.withdrawal[]}} body
 * @returns {Promise<Models.revenu & {credits: Models.credit[], costs: Models.cost[]}>}
 */
export async function updateRevenu(revenuId, body) {
  const { credits, costs, quotations, transactions, invoices, withdrawals, id, ...revenuBody } = body;
  let revenu = await prisma.revenu.findUnique({
    where: {
      id: +revenuId,
      user_id: this.request.user?.id || null,
    },
    include: {
      credits: true,
      costs: true,
      withdrawals: true,
    },
  });

  if (!revenu) throw new AppError(401, "Revenu not found!");

  if (credits) {
    await updateCreateOrDestroyChildItems("credit", revenu.credits, credits);
  }
  if (costs) {
    await updateCreateOrDestroyChildItems("cost", revenu.costs, costs);
  }
  if (withdrawals) {
    await updateCreateOrDestroyChildItems("withdrawal", revenu.withdrawals, withdrawals);
  }

  const revenuUpdated = updateRevenuStats(
    {
      ...revenuBody,
      credits,
      costs,
      invoices,
    },
    this.request.user
  );

  revenu = await prisma.revenu.update({
    where: {
      id: +revenuId,
    },
    data: {
      ...revenuUpdated,
      watchers: [revenuBody.watchers].join(),
    },
    include: {
      credits: true,
      costs: true,
      withdrawals: true,
    },
  });

  await invalidateCache(`user_${this.request.user?.id}_revenus`);
  await invalidateCache(`user_${this.request.user?.id}_revenu_${revenu?.id}`);
  return revenu;
}

/**
 * @this {API.This}
 * @param {string} revenu_id
 * @param {string} cost_id
 * @param {Models.Prisma.costUncheckedUpdateInput | Models.Prisma.costUncheckedCreateInput} body
 * @returns {Promise<Models.cost>}
 */
export async function updateOrCreateRevenuCost(revenu_id, cost_id, body) {
  let cost;
  if (cost_id && cost_id !== "undefined") {
    cost = await prisma.cost.findFirst({
      where: {
        id: +cost_id,
        revenu_id: +revenu_id,
      },
    });

    if (!cost) throw new AppError("cost not found!");

    cost = await prisma.cost.update({
      where: {
        id: +cost_id,
      },
      data: {
        payment_mean: body.payment_mean,
        asset_id: body.asset_id,
      },
    });
  } else {
    cost = await prisma.cost.create({
      data: {
        created_at: dayjs(body.created_at).toDate(),
        name: "" + body.name,
        total: +body.total,
        tva_amount: +body.tva_amount,
        recurrent: !!body.recurrent,
        payment_mean: "" + body.payment_mean,
        cost_category_id: +body.cost_category_id,
        revenu_id: +revenu_id,
        asset_id: +body.asset_id,
      },
    });
  }

  await invalidateCache(`user_${this.request.user?.id}_revenus`);
  await invalidateCache(`user_${this.request.user?.id}_revenu_${revenu_id}`);
  return cost;
}

/**
 * @this {API.This}
 * @param {string} revenu_id
 * @param {Models.Prisma.withdrawalUncheckedCreateInput & {initial_asset_id: number, destination_asset_id: number, cost_id: number, credit_id: number}} body
 * @returns {Promise<{ withdrawal: Models.withdrawal, cost: Models.cost, credit: Models.credit }>}
 */
// TODO: Prisma transaction
export async function createRevenuWithdrawal(revenu_id, body) {
  let revenu = await prisma.revenu.findFirst({
    where: {
      id: +revenu_id,
      user_id: this.request.user.id,
    },
  });

  if (!revenu) throw new AppError("Revenu not found!");

  const withdrawal = await prisma.withdrawal.create({
    data: {
      date: dayjs(body.date).toDate(),
      name: body.name,
      amount: +body.amount,
      exchange_fees: +body.exchange_fees,
      revenu_id: +revenu_id,
    },
  });

  const credit = await prisma.credit.create({
    data: {
      creditor: withdrawal.name,
      total: withdrawal.amount + withdrawal.exchange_fees,
      revenu_id: withdrawal.revenu_id,
      withdrawal_id: withdrawal.id,
      credit_category_id: 14,
      asset_id: +body.destination_asset_id,
    },
  });

  const cost = await prisma.cost.update({
    where: {
      id: body.cost_id,
    },
    data: {
      withdrawal_id: withdrawal.id,
      cost_category_id: 9,
      asset_id: +body.initial_asset_id,
    },
  });

  await invalidateCache(`user_${this.request.user?.id}_revenus`);
  await invalidateCache(`user_${this.request.user?.id}_revenu_${revenu_id}`);
  return { withdrawal, cost, credit };
}

/**
 * @this {API.This}
 * @returns {Promise<{ cost_categories: {id: number, name: string, icon: string, color: string}[], credit_categories: {id: number, name: string, icon: string, color: string}[] }>}
 */
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
 * @this {API.This}
 * @returns {Promise<{ withdrawal: Models.withdrawal, cost: Models.cost, credit: Models.credit }>}
 */
export async function downloadSample() {
  let rows;
  if (this.request.query?.entries) {
    rows = this.request.query.entries.map((e) => JSON.parse(e));
  } else {
    const cost = await prisma.cost.findFirst({
      orderBy: { created_at: "desc" },
    });

    const credit = await prisma.credit.findFirst({
      orderBy: { created_at: "desc" },
    });

    rows = [
      { date: credit.created_at, name: credit.creditor, total: credit.total },
      { date: cost.created_at, name: cost.name, total: cost.total },
    ];
  }

  const headers = ["date", "date", "name", "total"];

  return {
    stream: ExcelService.getReport(rows, headers, "Report", "csv"),
    filename: "revenu-download-sample.csv",
  };
}

/**
 * @param {Models.Prisma.revenuUncheckedUpdateInput & {credits: Models.credit[], costs: Models.cost[], invoices: Models.invoice[]}} revenu
 * @param {API.LoggedUser} user
 * @returns {Models.Prisma.revenuUncheckedUpdateInput & {credits: Models.credit[], costs: Models.cost[], invoices: Models.invoice[]}}
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
  if (revenu.credits) {
    for (let credit of revenu.credits) {
      total_credits += +credit.total;
      if (credit.credit_category_id === 6) continue;
      if (credit.credit_category_id === 10) {
        pro += +credit.total;
      } else if (credit.credit_category_id === 8) {
        refund += +credit.total;
      } else if (credit.credit_category_id !== 10) {
        perso += +credit.total;
      }

      if (credit.recurrent) {
        recurrent_credits += credit.total;
      }
    }
  }

  if (revenu.costs) {
    for (let cost of revenu.costs) {
      total_costs += +cost.total;
      if (cost.cost_category_id === 15) continue;
      if (cost.tva_amount) {
        tva_dispatched += +cost.tva_amount;
      }

      if (cost.recurrent) {
        recurrent_costs += cost.total;
      }

      if (cost.cost_category_id === 19) {
        investments += cost.total;
      } else {
        expense += +cost.total;
      }
    }
  }

  if (revenu.invoices) {
    for (let invoice of revenu.invoices) {
      if (invoice.tva_amount) {
        tva_dispatched += +invoice.tva_amount;
      }
    }
  }

  const revenuCopy = { ...revenu };

  revenuCopy.pro = pro || 0;
  revenuCopy.perso = perso || 0;
  revenuCopy.total = pro + perso || 0;
  revenuCopy.expense = expense || 0;
  revenuCopy.refund = refund || 0;
  revenuCopy.tva_collected = tva_collected || 0;
  revenuCopy.tva_dispatched = tva_dispatched || 0;
  revenuCopy.tva_balance = tva_collected - tva_dispatched || 0;
  revenuCopy.total_costs = total_costs || 0;
  revenuCopy.total_credits = total_credits || 0;
  revenuCopy.recurrent_costs = recurrent_costs || 0;
  revenuCopy.recurrent_credits = recurrent_credits || 0;
  revenuCopy.average_costs = expense / revenuCopy.costs.length || 0;
  revenuCopy.average_credits = revenuCopy.total / revenuCopy.credits.length || 0;
  revenuCopy.tax_amount = calculateTaxAmount(revenuCopy.total);
  let total_net = pro || 0;
  if (user.withholding_tax_active) {
    revenuCopy.total_net -= revenuCopy.tax_amount;
  }
  revenuCopy.total_net = total_net || 0;
  revenuCopy.investments = investments || 0;
  revenuCopy.balance = expense + revenuCopy.total || 0;
  delete revenuCopy.id;
  delete revenuCopy.costs;
  delete revenuCopy.credits;
  delete revenuCopy.invoices;
  delete revenuCopy.updated_at;

  return revenuCopy;
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
