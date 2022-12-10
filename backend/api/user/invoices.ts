import express, { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { getOrSetCache, invalidateCache } from "../../util/cacheManager.js";
import { pdfGenerator } from "../../util/pdfGenerator.js";
import { sendInvoice } from "../../util/mailer.js";
import { setFilters } from "../../util/filter.js";
import { AppError } from "../../util/AppError.js";
import { updateCreateOrDestroyChildItems } from "../../util/childItemsHandler.js";
import { prisma } from "../../util/prisma.js";
const router = express.Router();

type Invoice = Prisma.InvoicesGetPayload<{
  include: { 
    InvoiceItems: true,
    Customers: true
  }
}>

router.get(
  "/invoices",
  async (req: Request, res: Response, next: NextFunction) => {
    const { CustomerId } = req.query;
    const { per_page, offset, options } = setFilters(req.query);
    const force = req.query.force === "true";

    try {
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
              id: 'desc'
            },
          });

          return { rows: invoices, count };
        },
        force
      );

      res.json(invoices_data);
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/invoice/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const isPDF = req.query.pdf;

    try {
      const invoice: Invoice = await getOrSetCache(`invoice_${id}`, async () => {
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

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${invoiceName}"`
        );
        const doc = pdfGenerator(invoice);
        doc.pipe(res);
      } else {
        res.json(invoice);
      }
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/invoice",
  async (req: Request, res: Response, next: NextFunction) => {
    const { InvoiceItems, ...invoiceBody } = req.body;

    console.log("InvoiceItems", InvoiceItems)
    try {
      const invoice = await prisma.invoices.create({
        data: {
          ...invoiceBody,
          InvoiceItems: {
            create: InvoiceItems
          },
        },
        include: {
          InvoiceItems: true
        },
      });

      await invalidateCache(`invoices_customer_${invoice.CustomerId}`);
      res.json(invoice);
    } catch (error) {
      return next(error);
    }
  }
);

router.put(
  "/invoice/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    const { InvoiceItems, id, ...invoiceBody } = req.body;

    try {
      const invoice = await prisma.invoices.update({
        where: {
          id,
        },
        data: invoiceBody,
      });
      const existing_invoice_items = await prisma.invoiceItems.findMany({
        where: {
          InvoiceId: id,
        },
      });

      if (InvoiceItems)
        await updateCreateOrDestroyChildItems(
          "InvoiceItems",
          existing_invoice_items,
          InvoiceItems
        );

      await invalidateCache(`invoices_customer_${invoice.CustomerId}`);
      await invalidateCache(`invoice_${invoice.id}`);
      res.json(invoice);
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/send_invoice",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice: Invoice = await prisma.invoices.findFirstOrThrow({
        where: { id: Number(req.query.id) },
        include: {
          InvoiceItems: true,
          Customers: true,
        },
      });

      const message = await sendInvoice(invoice);
      res.json(message);
    } catch (error) {
      return next(error);
    }
  }
);

router.delete(
  "/invoice/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoice = await prisma.invoices.delete({
        where: { id: +req.params.id },
        select: {
          CustomerId: true,
        },
      });

      await invalidateCache(`invoices_customer_${invoice.CustomerId}`);
      res.json();
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
