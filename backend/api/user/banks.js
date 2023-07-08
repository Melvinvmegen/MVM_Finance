import { getOrSetCache, invalidateCache } from "../../util/cacheManager.js";
import { AppError } from "../../util/AppError.js";
import { prisma } from "../../util/prisma.js";

async function routes(app, options) {
  app.get("/banks", async (request, reply) => {
    const force = request.params.force === "true";
    const result = await getOrSetCache(
      "banks",
      async () => {
        const banks = await prisma.banks.findMany({
          where: {
            UserId: request?.auth?.userId,
          },
        });

        return banks;
      },
      force
    );

    return result;
  });

  app.get("/banks/:id", async (request, reply) => {
    const { id } = request.params;
    const bank = await getOrSetCache(`bank_${id}`, async () => {
      const bank = await prisma.banks.findFirst({
        where: {
          id: +id,
          UserId: request?.auth?.userId,
        },
      });
      if (!bank) throw new AppError(404, "Bank not found!");
      return bank;
    });

    return bank;
  });

  app.post("/banks", async (request, reply) => {
    const bank = await prisma.banks.create({
      data: {
        ...request.body,
        UserId: request?.auth?.userId,
      },
    });
    await invalidateCache("banks");
    return bank;
  });

  app.put("/banks/:id", async (request, reply) => {
    const { Invoices, Quotations, ...body } = request.body;
    let bank = await prisma.banks.findFirst({
      where: {
        id: +body.id,
        UserId: request?.auth?.userId,
      },
    });

    if (!bank) throw new AppError(404, "Bank not found!");

    bank = await prisma.banks.update({
      where: {
        id: +body.id,
      },
      data: {
        ...body,
        UserId: request?.auth?.userId,
      },
    });

    await invalidateCache(`bank_${bank.id}`);
    return bank;
  });
}
export default routes;
