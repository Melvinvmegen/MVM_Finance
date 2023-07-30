import { getOrSetCache, invalidateCache } from "../../utils/cacheManager.js";
import { pdfGenerator } from "../../utils/pdfGenerator.js";
import { setFilters } from "../../utils/filter.js";
import { AppError } from "../../utils/AppError.js";
import { updateCreateOrDestroyChildItems } from "../../utils/childItemsHandler.js";
import { prisma, Models } from "../../utils/prisma.js";
import { createInvoiceEmail } from "../../utils/mailer.js";

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
  app.$get("/customers/:CustomerId/quotations/:id/send-quotation", sendQuotation);
  app.$delete("/customers/:CustomerId/quotations/:id", deleteQuotation);
}

/**
 * @this {API.This}
 * @param {{ per_page: number, offset: number, force: string, options: any }} params
 * @returns {Promise<{ count: number, rows:Models.Quotations[] & { Revenus: Models.Revenus} }>}
 */
export async function getQuotations(params) {
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
  const quotations_data = await getOrSetCache(
    `quotations_customer_${CustomerId}`,
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
        orderBy: {
          id: "desc",
        },
        include: {
          Revenus: true,
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
 * @param {number} quotationId
 * @returns {Promise<Models.Quotations[] & { InvoiceItems: Models.InvoiceItems}>}
 */
export async function getQuotation(quotationId) {
  const quotation = await getOrSetCache(`quotation_${quotationId}`, async () => {
    const data = await prisma.quotations.findUnique({
      where: {
        id: +quotationId,
      },
      include: {
        InvoiceItems: true,
      },
    });
    return data;
  });

  if (!quotation) throw new AppError(404, "Quotation not found!");

  return quotation;
}

/**
 * @this {API.This}
 * @param { number } quotationId
 * @returns {Promise<API.DownloadReturns>}
 */
export async function downloadQuotation(quotationId) {
  const quotation = await getOrSetCache(`quotation_${quotationId}`, async () => {
    const data = await prisma.quotations.findUnique({
      where: {
        id: +quotationId,
      },
      include: {
        InvoiceItems: true,
      },
    });
    return data;
  });

  if (!quotation) throw new AppError(404, "Quotation not found!");

  return {
    filename: "invoice-" + quotationId + ".pdf",
    type: "application/pdf",
    stream: pdfGenerator(quotation),
  };
}

/**
 * @this {API.This}
 * @param {Models.Prisma.QuotationsCreateInput & { InvoiceItems: Models.Prisma.InvoiceItemsCreateInput }} body
 * @returns {Promise<Models.Quotations & {InvoiceItems: Models.InvoiceItems[]}>}
 */
export async function createQuotation(body) {
  const { InvoiceItems, ...quotationBody } = body;

  const quotation = await prisma.quotations.create({
    data: {
      ...quotationBody,
      InvoiceItems: {
        create: InvoiceItems,
      },
    },
    include: {
      InvoiceItems: true,
    },
  });

  await invalidateCache(`quotations_customer_${quotation.CustomerId}`);
  return quotation;
}

/**
 * @this {API.This}
 * @param {number} quotationId
 * @param {Models.Prisma.QuotationsUpdateInput & {InvoiceItems: Models.Prisma.InvoiceItemsUpdateInput}} body
 * @returns {Promise<Models.Quotations & {Revenus: Models.Revenus}>}
 */
export async function updateQuotation(quotationId, body) {
  const { InvoiceItems, ...quotationBody } = body;

  const quotation = await prisma.quotations.update({
    where: {
      id: quotationId,
    },
    data: quotationBody,
    include: {
      Revenus: true,
    },
  });
  const existing_invoice_items = await prisma.invoiceItems.findMany({
    where: {
      QuotationId: quotationId,
    },
  });

  if (InvoiceItems) {
    await updateCreateOrDestroyChildItems("InvoiceItems", existing_invoice_items, InvoiceItems);
  }

  await invalidateCache(`quotations_customer_${quotation.CustomerId}`);
  await invalidateCache(`quotation_${quotation.id}`);
  return quotation;
}

/**
 * @this {API.This}
 * @param {number} quotationId
 * @returns {Promise<Models.Invoices & {InvoiceItems: Models.InvoiceItems[]}>}
 */
export async function convertQuotationToInvoice(quotationId) {
  const quotation = await prisma.quotations.findUnique({
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
    where: {
      id: +quotationId,
    },
  });
  if (!quotation) throw new AppError(404, "Quotation not found!");
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

  await invalidateCache(`quotations_customer_${quotation.CustomerId}`);
  await invalidateCache(`invoices_customer_${invoice.CustomerId}`);
  return invoice;
}

// TODO: this should use an email service
/**
 * @this {API.This}
 * @param {number} quotationId
 */
export async function sendQuotation(quotationId) {
  const quotation = await prisma.quotations.findFirstOrThrow({
    where: { id: +quotationId },
    include: {
      InvoiceItems: true,
      Customers: true,
    },
  });

  await createInvoiceEmail(quotation);
  return;
}

/**
 * @this {API.This}
 * @param {number} quotationId
 */
export async function deleteQuotation(quotationId) {
  const quotation = await prisma.quotations.delete({
    where: { id: +quotationId },
    select: {
      CustomerId: true,
    },
  });

  await invalidateCache(`quotations_customer_${quotation.CustomerId}`);
  return;
}
