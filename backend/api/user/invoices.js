import { getOrSetCache, invalidateCache } from "../../util/cacheManager.js";
import { pdfGenerator } from "../../util/pdfGenerator.js";
import { createInvoiceEmail } from "../../util/mailer.js";
import { setFilters } from "../../util/filter.js";
import { AppError } from "../../util/AppError.js";
import { updateCreateOrDestroyChildItems } from "../../util/childItemsHandler.js";
import { prisma, Models } from "../../util/prisma.js";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$get("/customers/:CustomerId/invoices", getInvoices);
  app.$get("/customers/:CustomerId/invoices/:id", getInvoice);
  app.$download("/customers/:CustomerId/invoices/:id/download", downloadInvoice);
  app.$post("/customers/:CustomerId/invoices", createInvoice);
  app.$put("/customers/:CustomerId/invoices/:id", updateInvoice);
  app.$get("/customers/:CustomerId/invoices/:id/send-invoice", sendInvoice);
  app.$delete("/customers/:CustomerId/invoices/:id", deleteInvoice);
}

/**
 * @this {API.This}
 * @param {{ per_page: number, offset: number, force: string, options: any }} params
 * @returns {Promise<{ count: number, rows:Models.Invoices[] & { Revenus: Models.Revenus} }>}
 */
async function getInvoices(params) {
  const { CustomerId } = params.options;
  const { per_page, offset, options } = setFilters(params);
  const force = params.force === "true";

  const customer = await prisma.customers.findFirst({
    where: {
      id: +CustomerId,
      UserId: this.request?.user?.id,
    },
  });
  if (!customer) throw new AppError(404, "Customer not found");
  const invoices_data = await getOrSetCache(
    `invoices_customer_${CustomerId}`,
    async () => {
      const count = await prisma.invoices.count({
        where: {
          CustomerId: +CustomerId,
        },
      });
      const invoices = await prisma.invoices.findMany({
        where: options,
        skip: offset,
        take: per_page,
        orderBy: {
          id: "desc",
        },
        include: {
          Revenus: true,
        },
      });

      return { rows: invoices, count };
    },
    force
  );

  return invoices_data;
}

/**
 * @this {API.This}
 * @param {number} invoiceId
 * @returns {Promise<Models.Invoices[] & { InvoiceItems: Models.InvoiceItems}>}
 */
async function getInvoice(invoiceId) {
  const invoice = await getOrSetCache(`invoice_${invoiceId}`, async () => {
    const data = await prisma.invoices.findFirstOrThrow({
      where: {
        id: +invoiceId,
      },
      include: {
        InvoiceItems: true,
      },
    });
    return data;
  });

  if (!invoice) throw new AppError(404, "Invoice not found!");

  return invoice;
}

/**
 * @this {API.This}
 * @param {number} invoiceId
 * @returns {Promise<API.DownloadReturns>}>}
 */
async function downloadInvoice(invoiceId) {
  const invoice = await getOrSetCache(`invoice_${invoiceId}`, async () => {
    const data = await prisma.invoices.findFirstOrThrow({
      where: {
        id: +invoiceId,
      },
      include: {
        InvoiceItems: true,
      },
    });
    return data;
  });

  if (!invoice) throw new AppError(404, "Invoice not found!");

  return {
    filename: "invoice-" + invoiceId + ".pdf",
    type: "application/pdf",
    stream: pdfGenerator(invoice),
  };
}

/**
 * @this {API.This}
 * @param {Models.Prisma.InvoicesCreateInput & { InvoiceItems: Models.Prisma.InvoiceItemsCreateInput }} body
 * @returns {Promise<Models.Invoices & {InvoiceItems: Models.InvoiceItems[]}>}
 */
async function createInvoice(body) {
  const { InvoiceItems, ...invoiceBody } = body;

  const invoice = await prisma.invoices.create({
    data: {
      ...invoiceBody,
      InvoiceItems: {
        create: InvoiceItems,
      },
    },
    include: {
      InvoiceItems: true,
    },
  });

  await invalidateCache(`invoices_customer_${invoice.CustomerId}`);
  return invoice;
}

/**
 * @this {API.This}
 * @param {number} invoiceId
 * @param {Models.Prisma.InvoicesUpdateInput & {InvoiceItems: Models.Prisma.InvoiceItemsUpdateInput}} body
 * @returns {Promise<Models.Invoices & {Revenus: Models.Revenus}>}
 */
async function updateInvoice(invoiceId, body) {
  const { InvoiceItems, ...invoiceBody } = body;

  const invoice = await prisma.invoices.update({
    where: {
      id: invoiceId,
    },
    data: invoiceBody,
    include: {
      Revenus: true,
    },
  });
  const existing_invoice_items = await prisma.invoiceItems.findMany({
    where: {
      InvoiceId: invoiceId,
    },
  });

  if (InvoiceItems) await updateCreateOrDestroyChildItems("InvoiceItems", existing_invoice_items, InvoiceItems);

  await invalidateCache(`invoices_customer_${invoice.CustomerId}`);
  await invalidateCache(`invoice_${invoice.id}`);
  return invoice;
}

// TODO: this should use an email service
/**
 * @this {API.This}
 * @param {number} invoiceId
 */
async function sendInvoice(invoiceId) {
  const invoice = await prisma.invoices.findFirstOrThrow({
    where: { id: +invoiceId },
    include: {
      InvoiceItems: true,
      Customers: true,
    },
  });

  await createInvoiceEmail(invoice);
  return;
}

/**
 * @this {API.This}
 * @param {number} invoiceId
 */
async function deleteInvoice(invoiceId) {
  const invoice = await prisma.invoices.delete({
    where: { id: +invoiceId },
    select: {
      CustomerId: true,
    },
  });

  await invalidateCache(`invoices_customer_${invoice.CustomerId}`);
  return;
}
