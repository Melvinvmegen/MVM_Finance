import { getOrSetCache, invalidateCache } from "../../utils/cacheManager.js";
import { pdfGenerator } from "../../utils/pdfGenerator.js";
import { createInvoiceEmail } from "../../utils/mailer.js";
import { setFilters } from "../../utils/filter.js";
import { AppError } from "../../utils/AppError.js";
import { updateCreateOrDestroyChildItems } from "../../utils/childItemsHandler.js";
import { prisma, Models } from "../../utils/prisma.js";

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
 * @param {string} CustomerId
 * @param {{ per_page: number, offset: number, force: string, options: any }} params
 * @returns {Promise<{ count: number, rows:Models.Invoices[] & { Revenus: Models.Revenus} }>}
 */
export async function getInvoices(CustomerId, params) {
  if (!Number(CustomerId)) throw new AppError("Customer not found");
  const { per_page, offset, orderBy, options } = setFilters(params);
  const force = params.force === "true";

  const invoices_data = await getOrSetCache(
    `user_${this.request.user?.id}_customer_${CustomerId}_invoices`,
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
        orderBy: orderBy || { createdAt: "desc" },
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
 * @param {string} customerId
 * @param {string} invoiceId
 * @returns {Promise<Models.Invoices[] & { InvoiceItems: Models.InvoiceItems}>}
 */
export async function getInvoice(customerId, invoiceId) {
  const invoice = await getOrSetCache(
    `user_${this.request.user?.id}_customer_${customerId}_invoice_${invoiceId}`,
    async () => {
      const data = await prisma.invoices.findFirst({
        where: {
          id: +invoiceId,
          CustomerId: +customerId,
        },
        include: {
          InvoiceItems: true,
        },
      });
      return data;
    }
  );

  if (!invoice) throw new AppError("Invoice not found!");

  return invoice;
}

/**
 * @this {API.This}
 * @param {string} customerId
 * @param {string} invoiceId
 * @returns {Promise<API.DownloadReturns>}>}
 */
export async function downloadInvoice(customerId, invoiceId) {
  const invoice = await getOrSetCache(
    `user_${this.request.user?.id}_customer_${customerId}_invoice_${invoiceId}`,
    async () => {
      const data = await prisma.invoices.findFirst({
        where: {
          id: +invoiceId,
          CustomerId: +customerId,
        },
        include: {
          InvoiceItems: true,
        },
      });
      return data;
    }
  );

  if (!invoice) throw new AppError("Invoice not found!");

  return {
    filename: "mvm-invoice-" + invoiceId + ".pdf",
    type: "application/pdf",
    stream: pdfGenerator(invoice),
  };
}

/**
 * @this {API.This}
 * @param {string} customerId
 * @param {Models.Prisma.InvoicesCreateInput & { RevenuId: number, InvoiceItems: Models.Prisma.InvoiceItemsCreateInput }} body
 * @returns {Promise<Models.Invoices & {InvoiceItems: Models.InvoiceItems[]}>}
 */
export async function createInvoice(customerId, body) {
  const { InvoiceItems, ...invoiceBody } = body;
  const invoice = await prisma.invoices.create({
    data: {
      firstName: invoiceBody.firstName,
      lastName: invoiceBody.lastName,
      company: invoiceBody.company,
      address: invoiceBody.address,
      city: invoiceBody.city,
      paymentDate: invoiceBody.paymentDate,
      total: invoiceBody.total,
      totalDue: invoiceBody.totalDue,
      totalTTC: invoiceBody.totalTTC,
      tvaAmount: invoiceBody.tvaAmount,
      tvaApplicable: invoiceBody.tvaApplicable,
      paid: invoiceBody.paid,
      Customers: {
        connect: {
          id: +customerId,
        },
      },
      ...(invoiceBody.RevenuId && {
        Revenus: {
          connect: {
            id: +invoiceBody.RevenuId,
          },
        },
      }),
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
 * @param {string} customerId
 * @param {string} invoiceId
 * @param {Models.Prisma.InvoicesUpdateInput & {RevenuId: string, InvoiceItems: Models.Prisma.InvoiceItemsUpdateInput}} body
 * @returns {Promise<Models.Invoices & {Revenus: Models.Revenus}>}
 */
export async function updateInvoice(customerId, invoiceId, body) {
  const { InvoiceItems, ...invoiceBody } = body;

  const invoice = await prisma.invoices.update({
    where: {
      id: +invoiceId,
      CustomerId: +customerId,
    },
    data: {
      total: invoiceBody.total,
      totalTTC: invoiceBody.totalTTC,
      totalDue: invoiceBody.totalDue,
      tvaApplicable: invoiceBody.tvaApplicable,
      tvaAmount: invoiceBody.tvaAmount,
      paymentDate: invoiceBody.paymentDate,
      paid: invoiceBody.paid,
      ...(invoiceBody.RevenuId && { RevenuId: +invoiceBody.RevenuId }),
    },
    include: {
      Revenus: true,
    },
  });
  const existingInvoiceItems = await prisma.invoiceItems.findMany({
    where: {
      InvoiceId: +invoiceId,
    },
  });

  if (InvoiceItems) await updateCreateOrDestroyChildItems("InvoiceItems", existingInvoiceItems, InvoiceItems);

  await invalidateCache(`invoices_customer_${invoice.CustomerId}`);
  await invalidateCache(`invoice_${invoice.id}`);
  return invoice;
}

// TODO: this should use an email service
/**
 * @this {API.This}
 * @param {string} customerId
 * @param {string} invoiceId
 */
export async function sendInvoice(customerId, invoiceId) {
  const invoice = await prisma.invoices.findFirst({
    where: { id: +invoiceId, CustomerId: +customerId },
    include: {
      InvoiceItems: true,
      Customers: true,
    },
  });

  if (!invoice) throw new AppError("Invoice not found!");

  await createInvoiceEmail(invoice);
}

/**
 * @this {API.This}
 * @param {string} customerId
 * @param {string} invoiceId
 */
export async function deleteInvoice(customerId, invoiceId) {
  const invoice = await prisma.invoices.delete({
    where: { id: +invoiceId, CustomerId: +customerId },
    select: {
      CustomerId: true,
    },
  });

  await invalidateCache(`invoices_customer_${invoice.CustomerId}`);
}
