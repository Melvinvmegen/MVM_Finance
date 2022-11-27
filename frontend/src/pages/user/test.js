const {
  updateCreateOrDestroyChildItems,
} = require("../../util/childItemsHandler");
const { getOrSetCache } = require("../../util/cacheManager");
const { setFilters } = require("../../util/filter");
const router = require("express").Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const AppError = require("../../util/AppError");
const fs = require("fs");
const { parse } = require("csv-parse");
const { notFound } = require("../../util/errorHandler");
const { db }  = require('../../util/database')

router.get("/revenus", async (req: Request, res: Response, next: NextFunction) => {
  const alias = "r";
  const { per_page, offset, options } = setFilters(req.query, alias);

  // Force allows filtering by bypassing the cache without invalidating it
  const force = req.query.force === "true";

  try {
    const revenus_data = await getOrSetCache(
      `revenus`,
      async () => {
        const [count] = await db.count("* as count").from("Revenus");
        const revenus = await db
          .select(`*`)
          .from({ r: 'Revenus' })
          .offset(offset)
          .limit(per_page)
          .where(options)
          .orderBy("createdAt", "desc");

        for (const revenu of revenus) {
          const invoices = await db
            .select("*")
            .from("Invoices")
            .where("RevenuId", revenu.id);
          revenu.Invoices = invoices;
          const credits = await db
            .select("*")
            .from("Credits")
            .where("RevenuId", revenu.id);
          revenu.Credits = credits;
          const costs = await db
            .select("*")
            .from("Costs")
            .where("RevenuId", revenu.id);
          revenu.Costs = costs;
          const quotations = await db
            .select("*")
            .from("Quotations")
            .where("RevenuId", revenu.id);
          revenu.Quotations = quotations;
          const transactions = await db
            .select("*")
            .from("Transactions")
            .where("RevenuId", revenu.id);
          revenu.Transactions = transactions;
        }

        return { rows: revenus, ...count };
      },
      force
    );


    res.status(200).json(revenus_data);
  } catch (error) {
    return next(error);
  }
});

router.get("/revenu/:id", async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id;

  try {
    const data = await getOrSetCache(`revenu_${id}`, async () => {
      const [revenu] = await db
        .select("*")
        .from("Revenus")
        .where("id", id)
      if (!revenu) return notFound(next, "Revenu");
      const invoices = await db
        .select("*")
        .from("Invoices")
        .where("RevenuId", revenu.id);
      revenu.Invoices = invoices;
      const Credits = await db
        .select("*")
        .from("Credits")
        .where("RevenuId", revenu.id);
      const Costs = await db
        .select("*")
        .from("Costs")
        .where("RevenuId", revenu.id);
      const quotations = await db
        .select("*")
        .from("Quotations")
        .where("RevenuId", revenu.id);
      revenu.Quotations = quotations;
      const transactions = await db
        .select("*")
        .from("Transactions")
        .where("RevenuId", revenu.id);
      revenu.Transactions = transactions;

      return {
        revenu,
        Costs,
        Credits
      };
    });

    res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
});

router.put("/revenu/:id", async (req: Request, res: Response, next: NextFunction) => {
  const { Credits, Costs, ...revenuBody } = req.body;

  try {
    let [revenu] = await db
      .select("*")
      .from("Revenus")
      .where("id", req.params.id)
    Object.keys(revenu).forEach((key) => (revenu[key] = revenuBody[key]));
    result = await db("Revenus")
      .where("id", req.params.id)
      .update(revenu)
      .returning("*");
    let credits = await db
      .select("*")
      .from("Credits")
      .where("RevenuId", revenu.id);
    revenu.Credits = credits;
    let costs = await db
      .select("*")
      .from("Costs")
      .where("RevenuId", revenu.id);
    revenu.Costs = costs;

    if (Credits) {
      await updateCreateOrDestroyChildItems(
        db,
        "Credits",
        revenu.Credits,
        Credits
      );
    }
    if (Costs) await updateCreateOrDestroyChildItems(db, "Costs", revenu.Costs, Costs);

    // Reload childrens
    credits = await db
      .select("*")
      .from("Credits")
      .where("RevenuId", revenu.id);
    revenu.Credits = credits;
    costs = await db.select("*").from("Costs").where("RevenuId", revenu.id);
    revenu.Costs = costs;

    // Invalidate the cache every time we change something so that the front is always up to date
    await invalidateCache("revenus");
    await invalidateCache(`revenu_${revenu.id}`);
    res.status(201).json({ message: "Revenu updated successfully", revenu });
  } catch (error) {
    return next(error);
  }
});

router.post("/revenu", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) throw new AppError(400, "Please upload a CSV file!");

  try {
    let costs = [];
    let credits = [];
    let revenu;
    const revenus = [];
    fs.createReadStream(file.path)
      .pipe(parse({ delimiter: ",", from_line: 5 }))
      .on("data", (row) => {
        const total = +row[4];
        let date = row[0].split("/");
        const day = date[0];
        const month = date[1];
        const year = date[2];
        date = `${month}-${day}-${year}`;
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
        console.log("jsuis dans end")
        for (obj of [...costs, ...credits]) {
          const year = obj.createdAt.getFullYear();
          const month = obj.createdAt.getMonth();
          const beginning_of_month = new Date(year, month, 1);
          const end_of_month = new Date(year, month + 1, 0);
          [revenu] = await db
            .select("*")
            .from("Revenus")
            .where("createdAt", ">", beginning_of_month)
            .andWhere("createdAt", "<", end_of_month)

          if (!revenu) {
            [revenu] = await db("Revenus")
              .insert({
                createdAt: new Date(
                  beginning_of_month.setHours(beginning_of_month.getHours() + 4)
                ),
                updatedAt: new Date(
                  beginning_of_month.setHours(beginning_of_month.getHours() + 4)
                ),
              })
              .returning("*");
          }

          const newObj = {
            ...obj,
            RevenuId: revenu.id,
          };

          if (obj.total < 0) {
            const [cost] = await db
              .select("*")
              .from("Costs")
              .where("name", obj.name)
              .where("RevenuId", revenu.id)

            if (!cost) {
              await db("Costs").insert(newObj);
            } else {
              await db("Costs").where("id", cost.id).update(newObj);
            }
          } else {
            const [credit] = await db
              .select("*")
              .from("Credits")
              .where("creditor", obj.creditor)
              .where("RevenuId", revenu.id)
            if (!credit) {
              await db("Credits").insert(newObj);
            } else {
              await db("Credits").where("id", credit.id).update(newObj);
            }
          }

          if (!revenus.filter((r) => r.id === revenu.id).length)
            revenus.push(revenu);
        }

        for (let revenu of revenus) {
          let expense = 0;
          costs = await db
            .select("*")
            .from("Costs")
            .where("RevenuId", revenu.id);
          for (const cost of costs) {
            expense += Math.abs(cost.total);
          }

          let pro = 0;
          let perso = 0;
          credits = await db
            .select("*")
            .from("Credits")
            .where("RevenuId", revenu.id);
          for (const credit of credits) {
            if (credit.total == 2690 || credit.total == 2765) {
              pro += credit.total;
            } else {
              perso += credit.total;
            }
          }

          revenu = await db("Revenus")
            .where("id", revenu.id)
            .update({
              total: perso + pro,
              pro: pro,
              perso: perso,
              expense: -expense,
            });
        }

        await invalidateCache("revenus");
        fs.unlink(file.path, (err) => {
          if (err) throw new AppError(err);
          console.log(`${file.path} was deleted`);
        });
        res.status(201).json({ message: "Revenu created successfully", revenu });
      })
      .on("error", (error) => {
        throw error;
      });
  } catch (error) {
    throw new AppError(500, "Could not upload the file: " + error);
  }
});

module.exports = router;
