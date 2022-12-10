import express, { Request, Response, NextFunction } from "express";
import { getOrSetCache, invalidateCache } from "../../util/cacheManager.js";
import { pdfGenerator } from "../../util/pdfGenerator.js";
import { setFilters } from "../../util/filter.js";
import { AppError } from "../../util/AppError.js";
import { updateCreateOrDestroyChildItems } from "../../util/childItemsHandler.js";
import { prisma } from "../../util/prisma.js";
const router = express.Router();

router.get(
  "/quotations",
  async (req: Request, res: Response, next: NextFunction) => {
    const { CustomerId } = req.query;
    const { per_page, offset, options } = setFilters(req.query);
    const force = req.query.force === "true";

    try {
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
              id: 'desc'
            },
          });

          return { rows: quotations, count };
        },
        force
      );

      res.json(quotations_data);
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/quotation/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const isPDF = req.query.pdf;

    try {
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

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${quotationName}"`
        );
        let doc = pdfGenerator(quotation);
        doc.pipe(res);
      } else {
        res.json(quotation);
      }
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/quotation",
  async (req: Request, res: Response, next: NextFunction) => {
    const { InvoiceItems, ...quotationBody } = req.body;

    try {
      const quotation = await prisma.quotations.create({
        data: {
          ...quotationBody,
          InvoiceItems: {
            create: InvoiceItems
          },
        },
        include: {
          InvoiceItems: true
        },
      });

      await invalidateCache(`quotations_customer_${quotation.CustomerId}`);
      res.json(quotation);
    } catch (error) {
      return next(error);
    }
  }
);

router.put(
  "/quotation/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const { InvoiceItems, id, ...quotationBody } = req.body;

    try {
      const quotation = await prisma.quotations.update({
        where: {
          id,
        },
        data: quotationBody,
      });
      const existing_invoice_items = await prisma.invoiceItems.findMany({
        where: {
          QuotationId: id,
        },
      });

      if (InvoiceItems)
        await updateCreateOrDestroyChildItems(
          "InvoiceItems",
          existing_invoice_items,
          InvoiceItems
        );

      await invalidateCache(`quotations_customer_${quotation.CustomerId}`);
      await invalidateCache(`quotation_${quotation.id}`);
      res.json(quotation);
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/convert_quotation/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
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
          RevenuId  : true,
          cautionPaid  : true,
          tvaApplicable: true,
          totalTTC : true,
          tvaAmount: true,
          InvoiceId: true,
          InvoiceItems: {
            select: {
              id: true,
            }
          }
        },
        where: {
          id: +req.params.id,
        },
      });
      if (!quotation) throw new AppError(404, "Quotation not found!");
      if (quotation.InvoiceId)
        throw new AppError(403, "Quotation already converted.");

      const quotation_values = Object.fromEntries(
        Object.entries(quotation).filter(
          ([key]) =>
            key !== "id" &&
            key !== "InvoiceItems" && 
            key !== "InvoiceId" &&
            key !== "cautionPaid"
        )
      );

      const invoice = await prisma.invoices.create({
        data: {
          ...quotation_values,
          firstName: quotation.firstName,
          lastName: quotation.lastName,
          CustomerId: quotation.CustomerId,
          InvoiceItems: {
            connect: quotation.InvoiceItems.map(i => ({id: i.id}))
          }
        }
      });

      await prisma.quotations.update({
        where: { id: quotation.id },
        data: { InvoiceId: invoice.id }
      });

      await invalidateCache(`quotations_customer_${quotation.CustomerId}`);
      await invalidateCache(`invoices_customer_${invoice.CustomerId}`);
      res.json(invoice);
    } catch (error) {
      return next(error);
    }
  }
);

router.delete(
  "/quotation/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const quotation = await prisma.quotations.delete({
        where: { id: +req.params.id },
        select: {
          CustomerId: true,
        },
      });

      await invalidateCache(`quotations_customer_${quotation.CustomerId}`);
      res.json();
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
