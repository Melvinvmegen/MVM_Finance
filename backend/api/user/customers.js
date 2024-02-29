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
 * @returns {Promise<{count: number, rows: Models.customer[]}>}
 */
export async function getCustomers(params) {
  const { per_page, offset, orderBy, options } = setFilters(params);
  const force = params.force === "true";

  let error;
  const result = await getOrSetCache(
    `user_${this.request.user?.id}_customers`,
    async () => {
      try {
        const count = await prisma.customer.count();
        const rows = await prisma.customer.findMany({
          where: {
            ...options,
            user_id: this.request.user?.id || null,
          },
          orderBy: orderBy || { created_at: "desc" },
          include: {
            invoices: true,
          },
          skip: offset,
          take: per_page,
        });
        return { rows, count };
      } catch (err) {
        error = err;
        throw new Error(err);
      }
    },
    force
  );

  if (error) {
    throw new Error(`An expected error occured: ${error}`);
  }

  return result;
}

/**
 * @this {API.This}
 * @param {number} customer_id
 * @returns {Promise<Models.customer>}
 */
export async function getCustomer(customer_id) {
  let error;
  const customer = await getOrSetCache(`user_${this.request.user?.id}_customer_${customer_id}`, async () => {
    try {
      const customer = await prisma.customer.findFirst({
        where: {
          id: +customer_id,
          user_id: this.request.user?.id || null,
        },
      });

      if (!customer) throw new AppError("Customer not found!");

      return customer;
    } catch (err) {
      error = err;
      throw new Error(err);
    }
  });

  if (error) {
    throw new Error(`An expected error occured: ${error}`);
  }

  return customer;
}

/**
 * @this {API.This}
 * @param {Models.Prisma.customerUncheckedCreateInput} body
 * @returns {Promise<Models.customer & { invoices: Models.invoice[] }>}
 */
export async function createCustomer(body) {
  const customer = await prisma.customer.create({
    data: {
      ...body,
      user_id: this.request.user?.id || null,
    },
    include: {
      invoices: true,
    },
  });
  await invalidateCache(`user_${this.request.user?.id}_customers`);
  return customer;
}

/**
 * @this {API.This}
 * @param {string} customer_id
 * @param {Models.Prisma.customerUncheckedUpdateInput} body
 * @returns {Promise<Models.customer>}
 */
export async function updateCustomer(customer_id, body) {
  const { invoices, quotations, ...customerBody } = body;

  let customer = await prisma.customer.findFirst({
    where: {
      id: +customer_id,
      user_id: this.request.user?.id || null,
    },
  });

  if (!customer) throw new AppError("Customer not found!");

  customer = await prisma.customer.update({
    where: {
      id: +customer_id,
    },
    data: {
      ...customerBody,
      user_id: this.request.user?.id || null,
    },
  });

  await invalidateCache(`user_${this.request.user?.id}_customer_${customer.id}`);
  return customer;
}

/**
 * @this {API.This}
 * @param {string} customer_id
 */
export async function deleteCustomer(customer_id) {
  await prisma.customer.delete({
    where: {
      id: +customer_id,
      user_id: this.request.user?.id || null,
    },
  });
  await invalidateCache(`user_${this.request.user?.id}_customers`);
}
