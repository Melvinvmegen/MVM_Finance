import { AppError } from "../../utils/AppError.js";
import { prisma } from "../../utils/prisma.js";
import { pdfGenerator } from "../../utils/pdfGenerator.js";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$post("/invoices/generate-pdf", generatePDF);
}

/**
 * @this {API.This & { request: { body: { id: Number}}}}
 */
export async function generatePDF() {
  const id = this.request.body.id;
  if (!id) throw new AppError("Body not supported");

  const invoice = await prisma.invoices.findUnique({
    where: {
      id,
    },
    include: {
      InvoiceItems: true,
    },
  });

  if (!invoice) throw new AppError("Body not supported");
  pdfGenerator(invoice);
}
