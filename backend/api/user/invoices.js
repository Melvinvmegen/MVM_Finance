import { getOrSetCache, invalidateCache } from "../../util/cacheManager.js";
import { pdfGenerator } from "../../util/pdfGenerator.js";
import { sendInvoice } from "../../util/mailer.js";
import { setFilters } from "../../util/filter.js";
import { AppError } from "../../util/AppError.js";
import { updateCreateOrDestroyChildItems } from "../../util/childItemsHandler.js";
import { prisma } from "../../util/prisma.js";

async function routes(app, options) {
  app.get("/customers/:CustomerId/invoices", async (request, reply) => {
    const { CustomerId } = request.params;
    const { per_page, offset, options } = setFilters(request.params);
    const force = request.params.force === "true";

    if (!CustomerId) throw new AppError(404, "Customer not found");
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
  });

  app.get("/customers/:CustomerId/invoices/:id", async (request, reply) => {
    const id = request.params.id;
    const isPDF = request.params.pdf;

    const invoice = await getOrSetCache(`invoice_${id}`, async () => {
      const data = await prisma.invoices.findFirstOrThrow({
        where: {
          id: +id,
        },
        include: {
          InvoiceItems: true,
        },
      });
      return data;
    });

    if (!invoice) throw new AppError(404, "Invoice not found!");

    if (isPDF) {
      const invoiceName = "invoice-" + id + ".pdf";

      reply.setHeader("Content-Type", "application/pdf");
      reply.setHeader("Content-Disposition", `inline; filename="${invoiceName}"`);
      const doc = pdfGenerator(invoice);
      doc.pipe(reply);
    } else {
      return invoice;
    }
  });

  app.post("/customers/:CustomerId/invoices", async (request, reply) => {
    const { InvoiceItems, ...invoiceBody } = request.body;

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
  });

  app.put("/customers/:CustomerId/invoices/:id", async (request, reply) => {
    const { InvoiceItems, id, ...invoiceBody } = request.body;

    const invoice = await prisma.invoices.update({
      where: {
        id,
      },
      data: invoiceBody,
      include: {
        Revenus: true,
      },
    });
    const existing_invoice_items = await prisma.invoiceItems.findMany({
      where: {
        InvoiceId: id,
      },
    });

    if (InvoiceItems) await updateCreateOrDestroyChildItems("InvoiceItems", existing_invoice_items, InvoiceItems);

    await invalidateCache(`invoices_customer_${invoice.CustomerId}`);
    await invalidateCache(`invoice_${invoice.id}`);
    return invoice;
  });

  app.get("/customers/:CustomerId/invoices/:id/send_invoice", async (request, reply) => {
    const invoice = await prisma.invoices.findFirstOrThrow({
      where: { id: Number(request.params.id) },
      include: {
        InvoiceItems: true,
        Customers: true,
      },
    });

    const message = await sendInvoice(invoice);
    return message;
  });

  app.delete("/customers/:CustomerId/invoices/:id", async (request, reply) => {
    const invoice = await prisma.invoices.delete({
      where: { id: +request.params.id },
      select: {
        CustomerId: true,
      },
    });

    await invalidateCache(`invoices_customer_${invoice.CustomerId}`);
    return;
  });
}

export default routes;
