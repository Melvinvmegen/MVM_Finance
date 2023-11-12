import { getOrSetCache, invalidateCache } from "../../utils/cacheManager.js";
import { setFilters } from "../../utils/filter.js";
import { AppError } from "../../utils/AppError.js";
import { prisma, Models } from "../../utils/prisma.js";

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
export async function getCustomers(params) {
  const { per_page, offset, orderBy, options } = setFilters(params);
  const force = params.force === "true";

  const result = await getOrSetCache(
    `user_${this.request.user?.id}_customers`,
    async () => {
      const count = await prisma.customers.count();
      const rows = await prisma.customers.findMany({
        where: {
          ...options,
          UserId: this.request.user?.id || null,
        },
        orderBy: orderBy || { createdAt: "desc" },
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
export async function getCustomer(customerId) {
  const customer = await getOrSetCache(`user_${this.request.user?.id}_customer_${customerId}`, async () => {
    const customer = await prisma.customers.findFirst({
      where: {
        id: +customerId,
        UserId: this.request.user?.id || null,
      },
    });

    if (!customer) throw new AppError("Customer not found!");
    return customer;
  });

  return customer;
}

/**
 * @this {API.This}
 * @param {Models.Prisma.CustomersUncheckedCreateInput} body
 * @returns {Promise<Models.Customers & { Invoices: Models.Invoices[] }>}
 */
export async function createCustomer(body) {
  const customer = await prisma.customers.create({
    data: {
      ...body,
      UserId: this.request.user?.id || null,
    },
    include: {
      Invoices: true,
    },
  });
  await invalidateCache(`user_${this.request.user?.id}_customers`);
  return customer;
}

/**
 * @this {API.This}
 * @param {string} customerId
 * @param {Models.Prisma.CustomersUncheckedUpdateInput} body
 * @returns {Promise<Models.Customers>}
 */
export async function updateCustomer(customerId, body) {
  const { Invoices, Quotations, ...customerBody } = body;

  let customer = await prisma.customers.findFirst({
    where: {
      id: +customerId,
      UserId: this.request.user?.id || null,
    },
  });

  if (!customer) throw new AppError("Customer not found!");

  customer = await prisma.customers.update({
    where: {
      id: +customerId,
    },
    data: {
      ...customerBody,
      UserId: this.request.user?.id || null,
    },
  });

  await invalidateCache(`user_${this.request.user?.id}_customer_${customer.id}`);
  return customer;
}

/**
 * @this {API.This}
 * @param {string} customerId
 */
export async function deleteCustomer(customerId) {
  await prisma.customers.delete({
    where: {
      id: +customerId,
      UserId: this.request.user?.id || null,
    },
  });
  await invalidateCache(`user_${this.request.user?.id}_customers`);
}
