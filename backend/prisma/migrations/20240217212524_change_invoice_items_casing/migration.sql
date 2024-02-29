ALTER TABLE
  "InvoiceItems" RENAME COLUMN "InvoiceId" TO invoice_id;

ALTER TABLE
  "InvoiceItems" RENAME COLUMN "QuotationId" TO quotation_id;

ALTER TABLE "InvoiceItems"
RENAME TO invoice_item;