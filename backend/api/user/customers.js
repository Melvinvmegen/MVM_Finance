import { getOrSetCache, invalidateCache } from "../../util/cacheManager.js";
import { setFilters } from "../../util/filter.js";
import { AppError } from "../../util/AppError.js";
import { prisma, Models } from "../../util/prisma.js";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$get("/customers", getCustomers);
  app.$get("/customers/:id", getCustomer);
  app.$post("/customers", createCustomer);
  app.$put("/customers/:id", updateCustomer);
  app.$delete("/customers/:id", deleteCustomer);
}

/**
 * @this {API.This}
 * @param {{ per_page: number, offset: number, force: string, options: any }} params
 * @returns {Promise<{count: number, rows: Models.Customers[]}>}
 */
async function getCustomers(params) {
  const { per_page, offset, options } = setFilters(params);
  const force = params.force === "true";
  options.UserId = this.request?.user?.id;

  const result = await getOrSetCache(
    "customers",
    async () => {
      const count = await prisma.customers.count();
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

  return result;
}

/**
 * @this {API.This}
 * @param {number} customerId
 * @returns {Promise<Models.Customers>}
 */
async function getCustomer(customerId) {
  const customer = await getOrSetCache(`customer_${customerId}`, async () => {
    const customer = await prisma.customers.findFirst({
      where: {
        id: +customerId,
        UserId: this.request?.user?.id,
      },
    });

    if (!customer) throw new AppError(404, "Customer not found!");
    return customer;
  });

  return customer;
}

/**
 * @this {API.This}
 * @param {Models.Prisma.CustomersUncheckedCreateInput} body
 * @returns {Promise<Models.Customers & { Invoices: Models.Invoices[] }>}
 */
async function createCustomer(body) {
  const customer = await prisma.customers.create({
    data: {
      ...body,
      UserId: this.request?.user?.id,
    },
    include: {
      Invoices: true,
    },
  });
  await invalidateCache("customers");
  return customer;
}

/**
 * @this {API.This}
 * @param {string} customerId
 * @param {Models.Prisma.CustomersUncheckedUpdateInput} body
 * @returns {Promise<Models.Customers>}
 */
async function updateCustomer(customerId, body) {
  const { Invoices, Quotations, ...customerBody } = body;

  let customer = await prisma.customers.findFirst({
    where: {
      id: +customerId,
      UserId: this.request?.user?.id,
    },
  });

  if (!customer) throw new AppError(404, "Customer not found!");

  customer = await prisma.customers.update({
    where: {
      id: +customerId,
    },
    data: {
      ...customerBody,
      UserId: this.request?.user?.id,
    },
  });

  await invalidateCache(`customer_${customer.id}`);
  return customer;
}

/**
 * @this {API.This}
 * @param {string} customerId
 * @returns {Promise<Models.Customers>}
 */
async function deleteCustomer(customerId) {
  await prisma.customers.delete({
    where: {
      id: +customerId,
    },
  });
  await invalidateCache("customers");
  return;
}
