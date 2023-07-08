import express from "express";
import { updateCreateOrDestroyChildItems } from "../../util/childItemsHandler.js";
import { getOrSetCache, invalidateCache } from "../../util/cacheManager.js";
import { setFilters } from "../../util/filter.js";
import multer from "multer";
import { AppError } from "../../util/AppError.js";
import fs from "fs";
import { parse } from "csv-parse";
import { prisma } from "../../util/prisma.js";
const upload = multer({ dest: "uploads/" });
const router = express.Router();

router.get("/", async (req, res, next) => {
  const { per_page, offset, options } = setFilters(req.query);
  const force = req.query.force === "true";
  options.Banks = {
    UserId: req?.auth?.userId,
  };

  try {
    const revenus = await getOrSetCache(
      `revenus`,
      async () => {
        const count = await prisma.revenus.count();
        const rows = await prisma.revenus.findMany({
          where: options,
          take: per_page,
          skip: offset,
          orderBy: { createdAt: "desc" },
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
            Banks: true,
          },
        });

        return { rows, count };
      },
      force
    );

    res.json(revenus);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  const id = req.params.id;

  try {
    const revenu = await getOrSetCache(`revenu_${id}`, async () => {
      const revenu_fetched = await prisma.revenus.findUnique({
        where: {
          id: +req.params.id,
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
          Banks: true,
        },
      });

      if (revenu_fetched?.Banks?.UserId !== req?.auth?.userId) {
        throw new AppError(401, "Revenu not found!");
      }

      return revenu_fetched;
    });

    res.json(revenu);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  const { Credits, Costs, Quotations, Transactions, Invoices, Banks, UserId, ...revenuBody } = req.body;

  let revenu = await prisma.revenus.findUnique({
    where: {
      id: +req.params.id,
    },
    include: {
      Credits: true,
      Costs: true,
      Banks: true,
    },
  });

  if (revenu?.Banks?.UserId !== req?.auth?.userId) {
    throw new AppError(401, "Revenu not found!");
  }

  try {
    if (revenu && Credits) {
      await updateCreateOrDestroyChildItems("Credits", revenu.Credits, Credits);
    }
    if (revenu && Costs) {
      await updateCreateOrDestroyChildItems("Costs", revenu.Costs, Costs);
    }

    revenu = await prisma.revenus.update({
      where: {
        id: +req.params.id,
      },
      data: {
        ...revenuBody,
        watchers: revenuBody.watchers?.join(),
        BankId: +req?.auth?.userId,
      },
      include: {
        Credits: true,
        Costs: true,
        Banks: true,
      },
    });

    await invalidateCache("revenus");
    await invalidateCache(`revenu_${revenu?.id}`);
    res.json(revenu);
  } catch (error) {
    return next(error);
  }
});

let cost_category_cache = {};

router.post(
  "/",
  upload.single("file"),
  // @ts-ignore
  async (req, res) => {
    const file = req.file;
    try {
      if (!file) throw new AppError(400, "Please upload a CSV file!");
      let revenu;
      const costs = [];
      const credits = [];
      const revenus = [];
      fs.createReadStream(file.path)
        .pipe(parse({ delimiter: ",", from_line: 5 }))
        .on("data", (row) => {
          const total = +row[4];
          const [day, month, year] = row[0].split("/");
          const date = `${month}-${day}-${year}`;
          const name = row[2];
          if (total < 0) {
            costs.push({
              createdAt: new Date(date),
              updatedAt: new Date(date),
              name: name,
              total: total,
            });
          } else {
            credits.push({
              createdAt: new Date(date),
              updatedAt: new Date(date),
              reason: name,
              creditor: name,
              total: total,
            });
          }
        })
        .on("end", async () => {
          for (let obj of [...costs, ...credits]) {
            const year = obj.createdAt.getFullYear();
            const month = obj.createdAt.getMonth();
            const beginning_of_month = new Date(year, month, 1);
            const end_of_month = new Date(year, month + 1, 0);
            revenu = await prisma.revenus.findFirst({
              where: {
                createdAt: {
                  gte: beginning_of_month,
                  lte: end_of_month,
                },
                BankId: Number(req.originalParams?.bank_id),
              },
              include: {
                Costs: true,
                Credits: true,
                Banks: true,
              },
            });

            if (revenu?.Banks?.UserId !== req?.auth?.userId) {
              revenu = await prisma.revenus.create({
                data: {
                  createdAt: new Date(beginning_of_month.setHours(beginning_of_month.getHours() + 4)),
                  updatedAt: new Date(beginning_of_month.setHours(beginning_of_month.getHours() + 4)),
                  BankId: Number(req.originalParams?.bank_id),
                },
                include: {
                  Costs: true,
                  Credits: true,
                },
              });
            }

            const newObj = {
              ...obj,
              RevenuId: revenu?.id,
            };

            if (obj.total < 0) {
              const name = obj.name.replace(/[\d+/+]/g, "").trim();
              let cost_category = cost_category_cache[name];
              if (!cost_category) {
                cost_category = await prisma.costs.findFirst({
                  orderBy: { createdAt: "desc" },
                  select: {
                    category: true,
                    recurrent: true,
                  },
                  where: {
                    name: {
                      contains: name,
                    },
                  },
                });
                if (cost_category) {
                  cost_category_cache[name] = {
                    category: cost_category.category,
                    recurrent: cost_category.recurrent,
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

              if (cost_category_cache[name]) {
                newObj.category = cost_category_cache[name].category;
                newObj.recurrent = cost_category_cache[name].recurrent;
              }

              if (!cost) {
                cost = await prisma.costs.create({
                  data: newObj,
                });
              } else {
                cost = await prisma.costs.update({
                  where: {
                    id: cost.id,
                  },
                  data: newObj,
                });
              }
              if (revenu && !revenu.Costs.length) revenu.Costs = [];
              revenu.Costs.push(cost);
            } else {
              let credit = await prisma.credits.findFirst({
                where: {
                  creditor: obj.creditor,
                  total: obj.total,
                  RevenuId: revenu.id,
                },
              });

              if (!credit) {
                credit = await prisma.credits.create({
                  data: newObj,
                });
              } else {
                credit = await prisma.credits.update({
                  where: {
                    id: credit.id,
                  },
                  data: newObj,
                });
              }
              if (revenu && !revenu.Credits.length) revenu.Credits = [];
              revenu.Credits.push(credit);
            }

            if (!revenus.find((r) => r.id === revenu?.id)) revenus.push(revenu);
          }

          for (let revenu of revenus) {
            let expense = 0;
            for (let cost of revenu.Costs) {
              expense += Math.abs(cost.total);
            }

            let pro = 0;
            let perso = 0;
            for (let credit of revenu.Credits) {
              if (credit.total == 2690 || credit.total == 2765) {
                pro += credit.total;
              } else {
                perso += credit.total;
              }
            }

            revenu = await prisma.revenus.update({
              where: {
                id: revenu.id,
              },
              data: {
                pro,
                perso,
                total: perso + pro,
                expense: -expense,
              },
            });
          }

          await invalidateCache("revenus");
          fs.unlink(file.path, (err) => {
            if (err) {
              throw new AppError(500, `Could not upload the file: ${err}`);
            }
            console.log(`${file.path} was deleted`);
          });
          res.json(revenu);
        })
        .on("error", (error) => {
          throw error;
        });
    } catch (err) {
      throw new AppError(500, `Could not upload the file: ${err}`);
    }
  }
);

export default router;
