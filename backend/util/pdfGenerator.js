import PDFDocument from "pdfkit";

export const pdfGenerator = function (invoice) {
  let doc = new PDFDocument({ margin: 50 });

  generateHeader(doc, invoice);
  generateTableHeader(doc, invoice);
  generateInvoiceTable(doc, invoice);
  generateFooter(doc, invoice);

  doc.end();
  return doc;
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
    .text(`${invoice.firstName} ${invoice.lastName}`, 50, 190, { align: "right" })
    .text(`${invoice.address}`, 50, 210, { align: "right" })
    .text(`${invoice.city}`, 50, 230, { align: "right" })
    .moveDown();
}

function generateTableHeader(doc, invoice) {
  let today = new Date(invoice.createdAt);
  const date = formatDate(today);
  doc
    .fillColor("#444444")
    .fontSize(20)
    .text(`${invoice.hasOwnProperty("cautionPaid") ? "Devis" : "Facture"} n° : ${invoice.id}`, 50, 260)
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

  for (const invoice_item of invoice.InvoiceItems) {
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
  let totalTTCPostition = subtotalPosition + 20;
  if (invoice.tvaApplicable) {
    generateTableRow(doc, totalTTCPostition, "", "", "Total (HT)", formatCurrency(invoice.total * 100));
    doc.fontSize(8).font("Helvetica");
    generateTableRow(doc, subtotalPosition + 40, "", "", "TVA 20%", formatCurrency(invoice.tvaAmount * 100));
    // Dirty exception of generateHr as it used only
    doc
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(350, subtotalPosition + 55)
      .lineTo(550, subtotalPosition + 55)
      .stroke();
    totalTTCPostition += 50;
    doc.fontSize(12).font("Helvetica-Bold");
    generateTableRow(doc, totalTTCPostition, "", "", "Total (TTC)", formatCurrency(invoice.totalTTC * 100));
  } else {
    doc.fontSize(12).font("Helvetica-Bold");
    generateTableRow(doc, totalTTCPostition, "", "", "Total", formatCurrency(invoice.total * 100));
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

function formatDate(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0"); //January is 0!
  const yyyy = date.getFullYear();
  return `${mm} - ${dd} - ${yyyy}`;
}

function generateFooter(doc, invoice) {
  generateHr(doc, 690);

  const tvaText = invoice.tvaApplicable
    ? ""
    : "* TVA non applicable - article 293 B du CGI. Paiement à réception par virement. A défaut et conformément à la loi 2008-776 du 4 août 2008, un intérêt de retard égal à trois fois le taux légal sera appliqué, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 € (Décret 2012-1115 du 02/10/2012). Pas d'escompte pour paiement anticipé.";
  const tvaNumber = invoice.tvaApplicable ? "; N°TVA : FR36879755767" : "";

  doc
    .fontSize(8)
    .text(tvaText, 50, 650, { align: "left", width: 500 })
    .moveDown()
    .text("Code IBAN : FR76 3005 6002 7102 7100 5042 249", 50, 700, { align: "center" })
    .text("Code BIC : CCFRFRPP", 50, 710, { align: "center" })
    .text("Titulaire : VAN MEGEN Melvin", 50, 720, { align: "center" })
    .text(`SIRET : 87975576700016${tvaNumber}`, 50, 730, { align: "center" });
}
