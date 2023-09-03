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
}

/**
 * @this {API.This}
 * @param {{ per_page: number, offset: number, force: string, options: any }} params
 * @returns {Promise<{ count: number, rows:Models.Revenus[] & { Invoices: Models.Invoices, Credits: Models.Credits, Costs: Models.Costs, Quotations: Models.Quotations, Transactions: Models.Transactions, Banks: Models.Banks} }>}
 */
export async function getRevenus(params) {
  const { per_page, offset, orderBy, options } = setFilters(params);
  const force = params.force === "true";
  const revenus = await getOrSetCache(
    `revenus`,
    async () => {
      const count = await prisma.revenus.count();
      const rows = await prisma.revenus.findMany({
        where: options,
        take: per_page,
        skip: offset,
        orderBy: orderBy || { createdAt: "desc" },
        include: {
          Invoices: true,
          Credits: true,
          Costs: {
            orderBy: {
              createdAt: "desc",
            },
          },
          Quotations: true,
          Transactions: true,
          Banks: {
            where: {
              UserId: this.request.user?.id,
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
 * @param {{ BankId: string }} params
 * @returns {Promise<Models.Revenus[]>}
 */
export async function getRevenuIds(params) {
  const revenus = await getOrSetCache(`revenuIds`, async () => {
    return await prisma.revenus.findMany({
      where: {
        Banks: {
          id: +params.BankId,
          UserId: this.request.user?.id,
        },
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
 * @returns {Promise<Models.Revenus[] & { Invoices: Models.Invoices, Credits: Models.Credits, Costs: Models.Costs, Quotations: Models.Quotations, Transactions: Models.Transactions, Banks: Models.Banks}>}
 */
export async function getRevenu(revenuId) {
  const revenu = await getOrSetCache(`revenu_${revenuId}`, async () => {
    const revenu_fetched = await prisma.revenus.findUnique({
      where: {
        id: +revenuId,
      },
      include: {
        Invoices: true,
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
        Quotations: true,
        Transactions: true,
        Banks: {
          where: {
            UserId: this.request.user?.id,
          },
        },
      },
    });

    return revenu_fetched;
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
export async function createRevenu(bankId, upload) {
  const bank = await prisma.banks.findFirst({
    where: {
      UserId: this.request.user?.id,
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
      const total = +row[4];
      const [day, month, year] = row[0].split("/");
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
            BankId: +bankId,
          },
          include: {
            Costs: true,
            Credits: true,
            Banks: true,
          },
        });

        if (!revenu) {
          revenu = await prisma.revenus.create({
            data: {
              createdAt: beginningOfMonth,
              updatedAt: beginningOfMonth,
              BankId: +bankId,
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
            newObj.category = cost_category.category;
            newObj.recurrent = cost_category.recurrent;
          } else {
            const previousCost = await prisma.costs.findFirst({
              orderBy: { createdAt: "desc" },
              select: {
                category: true,
                recurrent: true,
              },
              where: {
                Revenus: {
                  BankId: +bankId,
                },
                name: {
                  contains: name,
                },
              },
            });

            if (previousCost) {
              cost_category_cache[name] = {
                category: previousCost.category,
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
              data: newObj,
            });
          } else {
            cost = await prisma.costs.create({
              data: newObj,
            });
          }
          revenu.Costs.push(cost);
        } else {
          let credit_category = credit_category_cache[name];
          if (credit_category) {
            newObj.category = credit_category.category;
            newObj.recurrent = credit_category.recurrent;
          } else {
            const previousCredit = await prisma.credits.findFirst({
              orderBy: { createdAt: "desc" },
              select: {
                category: true,
              },
              where: {
                creditor: {
                  contains: name,
                },
                Revenus: {
                  BankId: +bankId,
                },
              },
            });
            if (previousCredit) {
              credit_category = {
                category: previousCredit.category,
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
              data: newObj,
            });
          } else {
            credit = await prisma.credits.create({
              data: newObj,
            });
          }
          revenu.Credits.push(credit);
        }

        const revenuIndex = revenus.findIndex((i) => i.id === 2);
        if (revenuIndex > -1) {
          revenus[revenuIndex] = revenu;
        } else {
          revenus.push(revenu);
        }
      }

      for (let revenu of revenus) {
        const totalCredits = revenu.Credits.reduce((sum, credit) => sum + +credit.total, 0);
        const expense = revenu.Costs.reduce((sum, cost) => sum + Number(cost.total), 0);
        revenu = await prisma.revenus.update({
          where: {
            id: revenu.id,
          },
          data: {
            pro: 0,
            perso: 0,
            total: totalCredits,
            expense: expense,
          },
        });
      }

      await invalidateCache("revenus");
    })
    .on("error", (error) => {
      throw error;
    });
}

/**
 * @this {API.This}
 * @param {number} revenuId
 * @param {Models.Prisma.RevenusUpdateInput} body
 * @returns {Promise<Models.Revenus & {Credits: Models.Credits[], Costs: Models.Costs[], Banks: Models.Banks}>}
 */
export async function updateRevenu(revenuId, body) {
  const { Credits, Costs, Quotations, Transactions, Invoices, Banks, ...revenuBody } = body;
  let revenu = await prisma.revenus.findUnique({
    where: {
      id: +revenuId,
    },
    include: {
      Credits: true,
      Costs: true,
      Banks: {
        where: {
          UserId: this.request.user?.id,
        },
      },
    },
  });

  if (revenu && Credits) {
    await updateCreateOrDestroyChildItems("Credits", revenu.Credits, Credits);
  }
  if (revenu && Costs) {
    await updateCreateOrDestroyChildItems("Costs", revenu.Costs, Costs);
  }

  revenu = await prisma.revenus.update({
    where: {
      id: +revenuId,
    },
    data: {
      ...revenuBody,
      watchers: [revenuBody.watchers].join(),
      BankId: this.request.user?.id,
    },
    include: {
      Credits: true,
      Costs: true,
      Banks: true,
    },
  });

  await invalidateCache("revenus");
  await invalidateCache(`revenu_${revenu?.id}`);
  return revenu;
}
