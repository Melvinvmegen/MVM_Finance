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
  app.$get("/customers/:CustomerId/quotations", getQuotations);
  app.$get("/customers/:CustomerId/quotations/:id", getQuotation);
  app.$download("/customers/:CustomerId/quotations/:id/download", downloadQuotation);
  app.$post("/customers/:CustomerId/quotations", createQuotation);
  app.$put("/customers/:CustomerId/quotations/:id", updateQuotation);
  app.$post("/customers/:CustomerId/quotations/convert-quotation/:id", convertQuotationToInvoice);
  app.$delete("/customers/:CustomerId/quotations/:id", deleteQuotation);
}

/**
 * @this {API.This}
 * @param {string} CustomerId
 * @param {{ per_page: number, offset: number, force: string, options: any }} params
 * @returns {Promise<{ count: number, rows:Models.Quotations[] & { Revenus: Models.Revenus} }>}
 */
export async function getQuotations(CustomerId, params) {
  if (!Number(CustomerId)) throw new AppError("Customer not found");
  const { per_page, offset, orderBy, options } = setFilters(params);
  const force = params.force === "true";

  const quotations_data = await getOrSetCache(
    `user_${this.request.user?.id}_customer_${CustomerId}_quotations`,
    async () => {
      const count = await prisma.quotations.count({
        where: {
          CustomerId: +CustomerId,
        },
      });
      const quotations = await prisma.quotations.findMany({
        where: options,
        skip: offset,
        take: per_page,
        orderBy: orderBy || { created_at: "desc" },
        include: {
          Revenus: true,
          Customers: {
            select: {
              email: true,
            },
          },
          PendingEmails: {
            include: {
              CronTask: true,
            },
          },
        },
      });

      return { rows: quotations, count };
    },
    force
  );

  return quotations_data;
}

/**
 * @this {API.This}
 * @param {string} customerId
 * @param {string} quotationId
 * @returns {Promise<Models.Quotations[] & { InvoiceItems: Models.InvoiceItems}>}
 */
export async function getQuotation(customerId, quotationId) {
  const quotation = await getOrSetCache(
    `user_${this.request.user?.id}_customer_${customerId}_quotation_${quotationId}`,
    async () => {
      const data = await prisma.quotations.findUnique({
        where: {
          id: +quotationId,
          CustomerId: +customerId,
        },
        include: {
          InvoiceItems: true,
        },
      });
      return data;
    }
  );

  if (!quotation) throw new AppError("Quotation not found!");

  return quotation;
}

/**
 * @this {API.This}
 * @param {string} customerId
 * @param { string } quotationId
 * @returns {Promise<API.DownloadReturns>}
 */
export async function downloadQuotation(customerId, quotationId) {
  const quotation = await getOrSetCache(
    `user_${this.request.user?.id}_customer_${customerId}_quotation_${quotationId}`,
    async () => {
      const data = await prisma.quotations.findUnique({
        where: {
          id: +quotationId,
          CustomerId: +customerId,
        },
        include: {
          InvoiceItems: true,
        },
      });
      return data;
    }
  );

  if (!quotation) throw new AppError("Quotation not found!");

  if (quotation.uploadUrl) {
    const data = await ofetch(quotation.uploadUrl, {
      method: "GET",
      headers: { "Content-Type": "application/pdf" },
    });

    return {
      stream: Buffer.from(await data.arrayBuffer()),
      filename: "mvm-quotation-" + quotationId + ".pdf",
    };
  } else {
    await invalidateCache(`user_${this.request.user?.id}_customer_${customerId}_quotation_${quotation.id}`);
    return {
      filename: "mvm-quotation-" + quotationId + ".pdf",
      type: "application/pdf",
      stream: pdfGenerator(quotation),
    };
  }
}

/**
 * @this {API.This}
 * @param {string} customerId
 * @param {Models.Prisma.QuotationsCreateInput & { RevenuId: number, InvoiceItems: Models.Prisma.InvoiceItemsCreateInput }} body
 * @returns {Promise<Models.Quotations & {InvoiceItems: Models.InvoiceItems[]}>}
 */
export async function createQuotation(customerId, body) {
  const { InvoiceItems, ...quotationBody } = body;

  const quotation = await prisma.quotations.create({
    data: {
      firstName: quotationBody.firstName,
      lastName: quotationBody.lastName,
      company: quotationBody.company,
      address: quotationBody.address,
      city: quotationBody.city,
      paymentDate: quotationBody.paymentDate,
      total: quotationBody.total,
      totalTTC: quotationBody.totalTTC,
      tvaAmount: quotationBody.tvaAmount,
      tvaApplicable: quotationBody.tvaApplicable,
      cautionPaid: quotationBody.cautionPaid,
      Customers: {
        connect: {
          id: +customerId,
        },
      },
      ...(quotationBody.RevenuId && {
        Revenus: {
          connect: {
            id: +quotationBody.RevenuId,
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

  pdfGenerator(quotation);
  await invalidateCache(`user_${this.request.user?.id}_customer_${customerId}_quotations`);
  return quotation;
}

/**
 * @this {API.This}
 * @param {string} customerId
 * @param {string} quotationId
 * @param {Models.Prisma.QuotationsUpdateInput & {RevenuId: string, InvoiceItems: Models.Prisma.InvoiceItemsUpdateInput}} body
 * @returns {Promise<Models.Quotations & {Revenus: Models.Revenus}>}
 */
export async function updateQuotation(customerId, quotationId, body) {
  const { InvoiceItems, ...quotationBody } = body;

  const quotation = await prisma.quotations.update({
    where: {
      id: +quotationId,
      CustomerId: +customerId,
    },
    data: {
      total: quotationBody.total,
      totalTTC: quotationBody.totalTTC,
      cautionPaid: quotationBody.cautionPaid,
      tvaApplicable: quotationBody.tvaApplicable,
      tvaAmount: quotationBody.tvaAmount,
      paymentDate: quotationBody.paymentDate,
      ...(quotationBody.RevenuId && { RevenuId: +quotationBody.RevenuId }),
    },
    include: {
      Revenus: true,
    },
  });
  const existing_invoice_items = await prisma.invoiceItems.findMany({
    where: {
      QuotationId: +quotationId,
    },
  });

  if (InvoiceItems) {
    await updateCreateOrDestroyChildItems("InvoiceItems", existing_invoice_items, InvoiceItems);
  }

  pdfGenerator(quotation);
  await invalidateCache(`user_${this.request.user?.id}_customer_${customerId}_quotations`);
  await invalidateCache(`user_${this.request.user?.id}_customer_${customerId}_quotation_${quotation.id}`);
  return quotation;
}

/**
 * @this {API.This}
 * @param {string} customerId
 * @param {string} quotationId
 * @returns {Promise<Models.Invoices & {InvoiceItems: Models.InvoiceItems[]}>}
 */
export async function convertQuotationToInvoice(customerId, quotationId) {
  const quotation = await prisma.quotations.findUnique({
    where: {
      id: +quotationId,
      CustomerId: +customerId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: true,
      address: true,
      city: true,
      total: true,
      CustomerId: true,
      RevenuId: true,
      cautionPaid: true,
      tvaApplicable: true,
      totalTTC: true,
      tvaAmount: true,
      InvoiceId: true,
      InvoiceItems: {
        select: {
          id: true,
        },
      },
    },
  });
  if (!quotation) throw new AppError("Quotation not found!");
  if (quotation.InvoiceId) throw new AppError(403, "Quotation already converted.");

  const quotation_values = Object.fromEntries(
    Object.entries(quotation).filter(
      ([key]) => key !== "id" && key !== "InvoiceItems" && key !== "InvoiceId" && key !== "cautionPaid"
    )
  );

  const invoice = await prisma.invoices.create({
    data: {
      ...quotation_values,
      firstName: quotation.firstName,
      lastName: quotation.lastName,
      CustomerId: quotation.CustomerId,
      InvoiceItems: {
        connect: quotation.InvoiceItems.map((i) => ({ id: i.id })),
      },
    },
    include: {
      InvoiceItems: true,
    },
  });

  await prisma.quotations.update({
    where: { id: quotation.id },
    data: { InvoiceId: invoice.id },
  });

  await invalidateCache(`user_${this.request.user?.id}_customer_${customerId}_quotations`);
  await invalidateCache(`user_${this.request.user?.id}_customer_${customerId}_invoices`);
  return invoice;
}

/**
 * @this {API.This}
 * @param {string} customerId
 * @param {string} quotationId
 */
export async function deleteQuotation(customerId, quotationId) {
  await prisma.quotations.delete({
    where: { id: +quotationId, CustomerId: +customerId },
    select: {
      CustomerId: true,
    },
  });

  await invalidateCache(`user_${this.request.user?.id}_customer_${customerId}_quotations`);
}
