import { getOrSetCache, invalidateCache } from "../../util/cacheManager.js";
import { setFilters } from "../../util/filter.js";
import { AppError } from "../../util/AppError.js";
import { prisma } from "../../util/prisma.js";

async function routes(app, options) {
  app.get("/customers", async (request, reply) => {
    const { per_page, offset, options } = setFilters(request.params);
    const force = request.params.force === "true";
    options.UserId = request?.auth?.userId;

    const result = await getOrSetCache(
      "customers",
      async () => {
        const count = await prisma.customers.count({
          where: options,
        });
        const rows = await prisma.customers.findMany({
          where: options,
          include: {
            Invoices: true,
          },
          skip: offset,
          take: per_page,
        });

        return { rows, count };
      },
      force
    );

    return { result };
  });

  app.get("/customers/:id", async (request, reply) => {
    const { id } = request.params;
    const customer = await getOrSetCache(`customer_${id}`, async () => {
      const customer = await prisma.customers.findFirst({
        where: {
          id: +id,
          UserId: 1,
        },
      });

      if (!customer) throw new AppError(404, "Customer not found!");
      return customer;
    });

    return { customer };
  });

  app.post("/customers", async (request, reply) => {
    const customer = await prisma.customers.create({
      data: {
        ...request.body,
        UserId: request?.auth?.userId,
      },
      include: {
        Invoices: true,
      },
    });
    await invalidateCache("customers");
    return { customer };
  });

  app.put("/customers/:id", async (request, reply) => {
    const { Invoices, Quotations, ...body } = request.body;

    let customer = await prisma.customers.findFirst({
      where: {
        id: +body.id,
        UserId: request?.auth?.userId,
      },
    });

    if (!customer) throw new AppError(404, "Customer not found!");

    customer = await prisma.customers.update({
      where: {
        id: +request.body.id,
      },
      data: {
        ...body,
        UserId: request?.auth?.userId,
      },
    });

    await invalidateCache(`customer_${customer.id}`);
    return { customer };
  });

  app.delete("/customers/:id", async (request, reply) => {
    await prisma.customers.delete({
      where: {
        id: +request.params.id,
      },
    });
    await invalidateCache("customers");
    return;
  });
}

export default routes;
