import { getOrSetCache, invalidateCache } from "../../utils/cacheManager.js";
import { ofetch } from "ofetch";
import { pdfGenerator } from "../../utils/pdfGenerator.js";
import { setFilters } from "../../utils/filter.js";
import { AppError } from "../../utils/AppError.js";
import { updateCreateOrDestroyChildItems } from "../../utils/childItemsHandler.js";
import { prisma, Models } from "../../utils/prisma.js";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$get("/customers/:customer_id/quotations", getQuotations);
  app.$get("/customers/:customer_id/quotations/:id", getQuotation);
  app.$download("/customers/:customer_id/quotations/:id/download", downloadQuotation);
  app.$post("/customers/:customer_id/quotations", createQuotation);
  app.$put("/customers/:customer_id/quotations/:id", updateQuotation);
  app.$post("/customers/:customer_id/quotations/convert-quotation/:id", convertQuotationToInvoice);
  app.$delete("/customers/:customer_id/quotations/:id", deleteQuotation);
}

/**
 * @this {API.This}
 * @param {string} customer_id
 * @param {{ per_page: number, offset: number, force: string, options: any }} params
 * @returns {Promise<{ count: number, rows: Models.quotation[] & { revenu: Models.revenu} }>}
 */
export async function getQuotations(customer_id, params) {
  if (!Number(customer_id)) throw new AppError("Customer not found");
  const { per_page, offset, orderBy, options } = setFilters(params);
  const force = params.force === "true";
  let error;
  const quotations_data = await getOrSetCache(
    `user_${this.request.user?.id}_customer_${customer_id}_quotations`,
    async () => {
      try {
        const count = await prisma.quotation.count({
          where: {
            customer_id: +customer_id,
          },
        });
        const quotations = await prisma.quotation.findMany({
          where: options,
          skip: offset,
          take: per_page,
          orderBy: orderBy || { created_at: "desc" },
          include: {
            revenu: true,
            customer: {
              select: {
                email: true,
              },
            },
            pending_emails: {
              include: {
                cron_task: true,
              },
            },
          },
        });

        return { rows: quotations, count };
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

  return quotations_data;
}

/**
 * @this {API.This}
 * @param {string} customer_id
 * @param {string} quotation_id
 * @returns {Promise<Models.quotation[] & { invoice_items: Models.invoice_item[]}>}
 */
export async function getQuotation(customer_id, quotation_id) {
  let error;
  const quotation = await getOrSetCache(
    `user_${this.request.user?.id}_customer_${customer_id}_quotation_${quotation_id}`,
    async () => {
      try {
        const quotation = await prisma.quotation.findUnique({
          where: {
            id: +quotation_id,
            customer_id: +customer_id,
          },
          include: {
            invoice_items: true,
          },
        });
        if (!quotation) throw new AppError("Quotation not found!");

        return quotation;
      } catch (err) {
        error = err;
        throw new Error(err);
      }
    }
  );

  if (error) {
    throw new Error(`An expected error occured: ${error}`);
  }

  return quotation;
}

/**
 * @this {API.This}
 * @param {string} customer_id
 * @param {string} quotation_id
 * @returns {Promise<API.DownloadReturns>}
 */
export async function downloadQuotation(customer_id, quotation_id) {
  let error;
  const quotation = await getOrSetCache(
    `user_${this.request.user?.id}_customer_${customer_id}_quotation_${quotation_id}`,
    async () => {
      try {
        const data = await prisma.quotation.findUnique({
          where: {
            id: +quotation_id,
            customer_id: +customer_id,
          },
          include: {
            invoice_items: true,
          },
        });

        if (!data) throw new AppError("Quotation not found!");

        return data;
      } catch (err) {
        error = err;
        throw new Error(err);
      }
    }
  );

  if (error) {
    throw new Error(`An expected error occured: ${error}`);
  }

  if (quotation.upload_url) {
    const data = await ofetch(quotation.upload_url, {
      method: "GET",
      headers: { "Content-Type": "application/pdf" },
    });

    return {
      stream: Buffer.from(await data.arrayBuffer()),
      filename: "mvm-quotation-" + quotation_id + ".pdf",
    };
  } else {
    await invalidateCache(`user_${this.request.user?.id}_customer_${customer_id}_quotation_${quotation.id}`);
    return {
      filename: "mvm-quotation-" + quotation_id + ".pdf",
      type: "application/pdf",
      stream: pdfGenerator(quotation),
    };
  }
}

/**
 * @this {API.This}
 * @param {string} customer_id
 * @param {Models.Prisma.quotationCreateInput & { revenu_id: number, invoice_items: Models.Prisma.invoice_itemCreateInput[] }} body
 * @returns {Promise<Models.quotation & {invoice_items: Models.invoice_item[]}>}
 */
export async function createQuotation(customer_id, body) {
  const { invoice_items, ...quotation_body } = body;

  const quotation = await prisma.quotation.create({
    data: {
      first_name: quotation_body.first_name,
      last_name: quotation_body.last_name,
      company: quotation_body.company,
      address: quotation_body.address,
      city: quotation_body.city,
      payment_date: quotation_body.payment_date,
      total: quotation_body.total,
      total_ttc: quotation_body.total_ttc,
      tva_amount: quotation_body.tva_amount,
      tva_applicable: quotation_body.tva_applicable,
      caution_paid: quotation_body.caution_paid,
      customer: {
        connect: {
          id: +customer_id,
        },
      },
      ...(quotation_body.revenu_id && {
        revenu: {
          connect: {
            id: +quotation_body.revenu_id,
          },
        },
      }),
      invoice_items: {
        create: invoice_items,
      },
    },
    include: {
      invoice_items: true,
    },
  });

  pdfGenerator(quotation);
  await invalidateCache(`user_${this.request.user?.id}_customer_${customer_id}_quotations`);
  return quotation;
}

/**
 * @this {API.This}
 * @param {string} customer_id
 * @param {string} quotation_id
 * @param {Models.Prisma.quotationUpdateInput & {revenu_id: string, invoice_items: Models.Prisma.invoice_itemUpdateInput[]}} body
 * @returns {Promise<Models.quotation & {revenu: Models.revenu}>}
 */
export async function updateQuotation(customer_id, quotation_id, body) {
  const { invoice_items, ...quotation_body } = body;

  const quotation = await prisma.quotation.update({
    where: {
      id: +quotation_id,
      customer_id: +customer_id,
    },
    data: {
      total: quotation_body.total,
      total_ttc: quotation_body.total_ttc,
      caution_paid: quotation_body.caution_paid,
      tva_applicable: quotation_body.tva_applicable,
      tva_amount: quotation_body.tva_amount,
      payment_date: quotation_body.payment_date,
      ...(quotation_body.revenu_id && { revenu_id: +quotation_body.revenu_id }),
    },
    include: {
      revenu: true,
      invoice_items: true,
    },
  });

  if (invoice_items) {
    await updateCreateOrDestroyChildItems("invoice_items", quotation.invoice_items, invoice_items);
  }

  pdfGenerator(quotation);
  await invalidateCache(`user_${this.request.user?.id}_customer_${customer_id}_quotations`);
  await invalidateCache(`user_${this.request.user?.id}_customer_${customer_id}_quotation_${quotation.id}`);
  return quotation;
}

/**
 * @this {API.This}
 * @param {string} customer_id
 * @param {string} quotation_id
 * @returns {Promise<Models.invoice & {invoice_items: Models.invoice_item[]}>}
 */
export async function convertQuotationToInvoice(customer_id, quotation_id) {
  const quotation = await prisma.quotation.findUnique({
    where: {
      id: +quotation_id,
      customer_id: +customer_id,
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      company: true,
      address: true,
      city: true,
      total: true,
      customer_id: true,
      revenu_id: true,
      caution_paid: true,
      tva_applicable: true,
      total_ttc: true,
      tva_amount: true,
      invoice_id: true,
      invoice_items: {
        select: {
          id: true,
        },
      },
    },
  });
  if (!quotation) throw new AppError("Quotation not found!");
  if (quotation.invoice_id) throw new AppError(403, "Quotation already converted.");

  const quotation_values = Object.fromEntries(
    Object.entries(quotation).filter(
      ([key]) => key !== "id" && key !== "invoice_items" && key !== "invoice_id" && key !== "caution_paid"
    )
  );

  const invoice = await prisma.invoice.create({
    data: {
      ...quotation_values,
      first_name: quotation.first_name,
      last_name: quotation.last_name,
      customer_id: quotation.customer_id,
      invoice_items: {
        connect: quotation.invoice_items.map((i) => ({ id: i.id })),
      },
    },
    include: {
      invoice_items: true,
    },
  });

  await prisma.quotation.update({
    where: { id: quotation.id },
    data: { invoice_id: invoice.id },
  });

  await invalidateCache(`user_${this.request.user?.id}_customer_${customer_id}_quotations`);
  await invalidateCache(`user_${this.request.user?.id}_customer_${customer_id}_invoices`);
  return invoice;
}

/**
 * @this {API.This}
 * @param {string} customer_id
 * @param {string} quotation_id
 */
export async function deleteQuotation(customer_id, quotation_id) {
  await prisma.quotation.delete({
    where: { id: +quotation_id, customer_id: +customer_id },
    select: {
      customer_id: true,
    },
  });

  await invalidateCache(`user_${this.request.user?.id}_customer_${customer_id}_quotations`);
}
