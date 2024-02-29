import { getOrSetCache, invalidateCache } from "../../utils/cacheManager.js";
import { pdfGenerator } from "../../utils/pdfGenerator.js";
import { setFilters } from "../../utils/filter.js";
import { AppError } from "../../utils/AppError.js";
import { updateCreateOrDestroyChildItems } from "../../utils/childItemsHandler.js";
import { prisma, Models } from "../../utils/prisma.js";
import { ofetch } from "ofetch";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$get("/customers/:customer_id/invoices", getInvoices);
  app.$get("/customers/:customer_id/invoices/:id", getInvoice);
  app.$download("/customers/:customer_id/invoices/:id/download", downloadInvoice);
  app.$post("/customers/:customer_id/invoices", createInvoice);
  app.$put("/customers/:customer_id/invoices/:id", updateInvoice);
  app.$delete("/customers/:customer_id/invoices/:id", deleteInvoice);
}

/**
 * @this {API.This}
 * @param {string} customer_id
 * @param {{ per_page: number, offset: number, force: string, options: any }} params
 * @returns {Promise<{ count: number, rows:Models.invoice[] & { revenu: Models.revenu} }>}
 */
export async function getInvoices(customer_id, params) {
  if (!Number(customer_id)) throw new AppError("Customer not found");
  const { per_page, offset, orderBy, options } = setFilters(params);
  const force = params.force === "true";
  let error;
  const invoices_data = await getOrSetCache(
    `user_${this.request.user?.id}_customer_${customer_id}_invoices`,
    async () => {
      try {
        const count = await prisma.invoice.count({
          where: {
            customer_id: +customer_id,
          },
        });
        const invoices = await prisma.invoice.findMany({
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

        return { rows: invoices, count };
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

  return invoices_data;
}

/**
 * @this {API.This}
 * @param {string} customer_id
 * @param {string} invoice_id
 * @returns {Promise<Models.invoice[] & { invoice_items: Models.invoice_item[]}>}
 */
export async function getInvoice(customer_id, invoice_id) {
  let error;
  const invoice = await getOrSetCache(
    `user_${this.request.user?.id}_customer_${customer_id}_invoice_${invoice_id}`,
    async () => {
      try {
        const invoice = await prisma.invoice.findFirst({
          where: {
            id: +invoice_id,
            customer_id: +customer_id,
          },
          include: {
            invoice_items: true,
          },
        });

        if (!invoice) throw new AppError("Invoice not found!");

        return invoice;
      } catch (err) {
        error = err;
        throw new Error(err);
      }
    }
  );

  if (error) {
    throw new Error(`An expected error occured: ${error}`);
  }

  return invoice;
}

/**
 * @this {API.This}
 * @param {string} customer_id
 * @param {string} invoice_id
 * @returns {Promise<API.DownloadReturns>}>}
 */
export async function downloadInvoice(customer_id, invoice_id) {
  let error;
  const invoice = await getOrSetCache(
    `user_${this.request.user?.id}_customer_${customer_id}_invoice_${invoice_id}`,
    async () => {
      try {
        const invoice = await prisma.invoice.findFirst({
          where: {
            id: +invoice_id,
            customer_id: +customer_id,
          },
          include: {
            invoice_items: true,
          },
        });

        if (!invoice) throw new AppError("Invoice not found!");

        return invoice;
      } catch (err) {
        error = err;
        throw new Error(err);
      }
    }
  );

  if (error) {
    throw new Error(`An expected error occured: ${error}`);
  }

  if (invoice.upload_url) {
    const data = await ofetch(invoice.upload_url, {
      method: "GET",
      headers: { "Content-Type": "application/pdf" },
    });

    return {
      stream: Buffer.from(await data.arrayBuffer()),
      filename: "mvm-invoice-" + invoice_id + ".pdf",
    };
  } else {
    await invalidateCache(`user_${this.request.user?.id}_customer_${customer_id}_invoice_${invoice.id}`);
    return {
      filename: "mvm-invoice-" + invoice_id + ".pdf",
      type: "application/pdf",
      stream: pdfGenerator(invoice),
    };
  }
}

/**
 * @this {API.This}
 * @param {string} customer_id
 * @param {Models.Prisma.invoiceCreateInput & { revenu_id: number, invoice_items: Models.Prisma.invoice_itemCreateInput[] }} body
 * @returns {Promise<Models.invoice & {invoice_items: Models.invoice_item[]}>}
 */
export async function createInvoice(customer_id, body) {
  const { invoice_items, ...invoice_body } = body;
  const invoice = await prisma.invoice.create({
    data: {
      first_name: invoice_body.first_name,
      last_name: invoice_body.last_name,
      company: invoice_body.company,
      address: invoice_body.address,
      city: invoice_body.city,
      payment_date: invoice_body.payment_date,
      total: invoice_body.total,
      total_due: invoice_body.total_due,
      total_ttc: invoice_body.total_ttc,
      tva_amount: invoice_body.tva_amount,
      tva_applicable: invoice_body.tva_applicable,
      paid: invoice_body.paid,
      recurrent: invoice_body.recurrent,
      vat_number: invoice_body.vat_number,
      customer: {
        connect: {
          id: +customer_id,
        },
      },
      ...(invoice_body.revenu_id && {
        revenu: {
          connect: {
            id: +invoice_body.revenu_id,
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

  pdfGenerator(invoice);
  await invalidateCache(`user_${this.request.user?.id}_customer_${customer_id}_invoices`);
  return invoice;
}

/**
 * @this {API.This}
 * @param {string} customer_id
 * @param {string} invoice_id
 * @param {Models.Prisma.invoiceUpdateInput & {revenu_id: string, invoice_items: Models.Prisma.invoice_itemUpdateInput[]}} body
 * @returns {Promise<Models.invoice & {revenu: Models.revenu, invoice_items: Models.invoice_item[]}>}
 */
export async function updateInvoice(customer_id, invoice_id, body) {
  const { invoice_items, ...invoice_body } = body;

  const invoice = await prisma.invoice.update({
    where: {
      id: +invoice_id,
      customer_id: +customer_id,
    },
    data: {
      total: invoice_body.total,
      total_ttc: invoice_body.total_ttc,
      total_due: invoice_body.total_due,
      tva_applicable: invoice_body.tva_applicable,
      tva_amount: invoice_body.tva_amount,
      payment_date: invoice_body.payment_date,
      paid: invoice_body.paid,
      recurrent: invoice_body.recurrent,
      vat_number: invoice_body.vat_number,
      ...(invoice_body.revenu_id && { revenu_id: +invoice_body.revenu_id }),
    },
    include: {
      revenu: true,
      invoice_items: true,
    },
  });

  if (invoice_items) await updateCreateOrDestroyChildItems("invoice_items", invoice.invoice_items, invoice_items);

  pdfGenerator(invoice);
  await invalidateCache(`user_${this.request.user?.id}_customer_${customer_id}_invoices`);
  await invalidateCache(`user_${this.request.user?.id}_customer_${customer_id}_invoice_${invoice_id}`);
  return invoice;
}

/**
 * @this {API.This}
 * @param {string} customer_id
 * @param {string} invoice_id
 */
export async function deleteInvoice(customer_id, invoice_id) {
  await prisma.invoice.delete({
    where: { id: +invoice_id, customer_id: +customer_id },
    select: {
      customer_id: true,
    },
  });

  await invalidateCache(`user_${this.request.user?.id}_customer_${customer_id}_invoices`);
}
