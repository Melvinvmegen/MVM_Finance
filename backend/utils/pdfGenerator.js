/* eslint-disable no-console */
import { cloudinary } from "./cloudinary.js";
import { prisma } from "./prisma.js";
import { PassThrough } from "stream";
import PDFDocument from "pdfkit";
import dayjs from "dayjs";

export const pdfGenerator = function (invoice) {
  let doc = new PDFDocument({ margin: 50 });

  const pdfStream = new PassThrough();
  doc.pipe(pdfStream);

  generateHeader(doc, invoice);
  generateTableHeader(doc, invoice);
  generateInvoiceTable(doc, invoice);
  generateFooter(doc, invoice);

  doc.end();

  pdfStream.pipe(
    cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: `${"caution_paid" in invoice ? "quotation" : "invoice"}-${invoice.id}`,
        folder: "finance",
      },
      async (error, result) => {
        if (error) {
          console.error(`[Cloudinary] Error uploading for model ${invoice.id}, error: ${error}`);
        } else {
          console.log(`[Cloudinary] Upload successful for model ${invoice.id}, secure_url: ${result.secure_url}`);
          if ("caution_paid" in invoice) {
            await prisma.quotation.update({
              where: {
                id: invoice.id,
              },
              data: {
                upload_url: result.secure_url,
              },
            });
          } else {
            await prisma.invoice.update({
              where: {
                id: invoice.id,
              },
              data: {
                upload_url: result.secure_url,
              },
            });
          }
        }
      }
    )
  );

  return pdfStream;
};

function generateHeader(doc, invoice) {
  doc
    .image("images/logo.png", 50, 45, { width: 100 })
    .fillColor("#444444")
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("MELVIN VAN MEGEN", 50, 150)
    .font("Helvetica")
    .text("Melvin.vmegen@gmail.com", 50, 170)
    .text("N° SIRET : 879 755 767 000 24", 50, 190)
    .font("Helvetica-Bold")
    .text(invoice.company, 50, 150, { align: "right" })
    .font("Helvetica")
    .text("A l'attention de M. ou Mme", 50, 170, { align: "right" })
    .text(`${invoice.first_name} ${invoice.last_name}`, 50, 190, { align: "right" })
    .text(`${invoice.address}`, 50, 210, { align: "right" })
    .text(`${invoice.city}`, 50, 230, { align: "right" });
  if (invoice.vat_number) {
    doc.text(`N°TVA ${invoice.vat_number}`, 50, 250, { align: "right" });
  }
  doc.moveDown();
}

function generateTableHeader(doc, invoice) {
  const date = dayjs(invoice.created_at).format("MM - DD - YYYY");
  doc
    .fillColor("#444444")
    .fontSize(20)
    .text(`${"caution_paid" in invoice ? "Devis" : "Facture"} n° : ${invoice.id}`, 50, 260)
    .fontSize(10)
    .text(`Le : ${date}`, 50, 290)
    .text(`Mode de réglement : paiement à réception (RIB ci-dessous).`, 50, 310);
}

function generateInvoiceTable(doc, invoice) {
  let i = 0;
  let invoiceTableTop = 330;

  doc.font("Helvetica-Bold");
  generateHr(doc, invoiceTableTop);
  generateTableRow(doc, invoiceTableTop + 10, "Désignation", "Unité", "Quantité", "Prix TTC");
  generateHr(doc, invoiceTableTop + 30);
  doc.font("Helvetica");

  for (const invoice_item of invoice.invoice_items) {
    i += 1;
    let position = invoiceTableTop + (i + 1) * 20;
    if (position > 630) {
      doc.addPage();
      invoiceTableTop = -200;
      position = invoiceTableTop + (i + 1) * 20;
    }
    generateTableRow(
      doc,
      position,
      invoice_item.name,
      `${invoice_item.unit}`,
      `${invoice_item.quantity}`,
      formatCurrency(invoice_item.total * 100)
    );
    generateHr(doc, position + 15);
  }

  const subtotalPosition = invoiceTableTop + (i + 3) * 20;
  let total_ttc_position = subtotalPosition + 20;
  if (invoice.tva_applicable) {
    generateTableRow(doc, total_ttc_position, "", "", "Total (HT)", formatCurrency(invoice.total * 100));
    doc.fontSize(8).font("Helvetica");
    generateTableRow(doc, subtotalPosition + 40, "", "", "TVA 20%", formatCurrency(invoice.tva_amount * 100));
    // Dirty exception of generateHr as it used only
    doc
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(350, subtotalPosition + 55)
      .lineTo(550, subtotalPosition + 55)
      .stroke();
    total_ttc_position += 50;
    doc.fontSize(12).font("Helvetica-Bold");
    generateTableRow(doc, total_ttc_position, "", "", "Total (TTC)", formatCurrency(invoice.total_ttc * 100));
  } else {
    doc.fontSize(12).font("Helvetica-Bold");
    generateTableRow(doc, total_ttc_position, "", "", "Total", formatCurrency(invoice.total * 100));
  }
  doc.fontSize(10).font("Helvetica");
}

function generateTableRow(doc, y, item, unitCost, quantity, lineTotal) {
  doc
    .text(item, 50, y)
    .text(unitCost, 230, y, { width: 90, align: "right" })
    .text(quantity, 330, y, { width: 90, align: "right" })
    .text(lineTotal, 430, y, { width: 90, align: "right" });
}

function generateHr(doc, y) {
  doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}

function formatCurrency(cents) {
  return (cents / 100).toFixed(2) + " €";
}

function generateFooter(doc, invoice) {
  generateHr(doc, 690);

  const tva_text = invoice.tva_applicable
    ? ""
    : "* TVA non applicable - article 293 B du CGI. Paiement à réception par virement. A défaut et conformément à la loi 2008-776 du 4 août 2008, un intérêt de retard égal à trois fois le taux légal sera appliqué, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 € (Décret 2012-1115 du 02/10/2012). Pas d'escompte pour paiement anticipé.";
  const tva_number = invoice.tva_applicable ? "; N°TVA : FR36879755767" : "";

  doc
    .fontSize(8)
    .text(tva_text, 50, 650, { align: "left", width: 500 })
    .moveDown()
    .text("Code IBAN : FR76 4061 8803 9600 0407 6132 406", 50, 700, { align: "center" })
    .text("Code BIC : CCFRFRPP", 50, 710, { align: "center" })
    .text("Titulaire : VAN MEGEN Melvin", 50, 720, { align: "center" })
    .text(`SIRET : 87975576700016${tva_number}`, 50, 730, { align: "center" });
}
