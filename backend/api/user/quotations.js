import { getOrSetCache, invalidateCache } from "../../util/cacheManager.js";
import { pdfGenerator } from "../../util/pdfGenerator.js";
import { setFilters } from "../../util/filter.js";
import { AppError } from "../../util/AppError.js";
import { updateCreateOrDestroyChildItems } from "../../util/childItemsHandler.js";
import { prisma } from "../../util/prisma.js";

async function routes(app, options) {
  app.get("/customers/:CustomerId/quotations", async (request, reply) => {
    const { CustomerId } = request.params;
    const { per_page, offset, options } = setFilters(request.params);
    const force = request.params.force === "true";

    if (!CustomerId) throw new AppError(404, "Customer not found");
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
  });

  app.get("/customers/:CustomerId/quotations/:id", async (request, reply) => {
    const id = request.params.id;
    const isPDF = request.params.pdf;

    const quotation = await getOrSetCache(`quotation_${id}`, async () => {
      const data = await prisma.quotations.findUnique({
        where: {
          id: +id,
        },
        include: {
          InvoiceItems: true,
        },
      });
      return data;
    });

    if (!quotation) throw new AppError(404, "Quotation not found!");

    if (isPDF) {
      const quotationName = "quotation-" + id + ".pdf";

      reply.setHeader("Content-Type", "application/pdf");
      reply.setHeader("Content-Disposition", `inline; filename="${quotationName}"`);
      let doc = pdfGenerator(quotation);
      doc.pipe(reply);
    } else {
      return quotation;
    }
  });

  app.post("/customers/:CustomerId/quotations", async (request, reply) => {
    const { InvoiceItems, ...quotationBody } = request.body;

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
  });

  app.put("/customers/:CustomerId/quotations/:id", async (request, reply) => {
    const { InvoiceItems, id, ...quotationBody } = request.body;

    const quotation = await prisma.quotations.update({
      where: {
        id,
      },
      data: quotationBody,
      include: {
        Revenus: true,
      },
    });
    const existing_invoice_items = await prisma.invoiceItems.findMany({
      where: {
        QuotationId: id,
      },
    });

    if (InvoiceItems) {
      await updateCreateOrDestroyChildItems("InvoiceItems", existing_invoice_items, InvoiceItems);
    }

    await invalidateCache(`quotations_customer_${quotation.CustomerId}`);
    await invalidateCache(`quotation_${quotation.id}`);
    return quotation;
  });

  app.post("/customers/:CustomerId/quotations/convert_quotation/:id", async (request, reply) => {
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
        id: +request.params.id,
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
    });

    await prisma.quotations.update({
      where: { id: quotation.id },
      data: { InvoiceId: invoice.id },
    });

    await invalidateCache(`quotations_customer_${quotation.CustomerId}`);
    await invalidateCache(`invoices_customer_${invoice.CustomerId}`);
    return invoice;
  });

  app.delete("/customers/:CustomerId/quotations/:id", async (request, reply) => {
    const quotation = await prisma.quotations.delete({
      where: { id: +request.params.id },
      select: {
        CustomerId: true,
      },
    });

    await invalidateCache(`quotations_customer_${quotation.CustomerId}`);
    return;
  });
}

export default routes;
