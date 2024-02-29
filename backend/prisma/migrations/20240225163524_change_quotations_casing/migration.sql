ALTER TABLE
  "Quotations" RENAME COLUMN "firstName" TO first_name;

ALTER TABLE
  "Quotations" RENAME COLUMN "lastName" TO last_name;

ALTER TABLE
  "Quotations" RENAME COLUMN "vatNumber" TO vat_number;

ALTER TABLE
  "Quotations" RENAME COLUMN "cautionPaid" TO caution_paid;

ALTER TABLE
  "Quotations" RENAME COLUMN "tvaApplicable" TO tva_applicable;

ALTER TABLE
  "Quotations" RENAME COLUMN "totalTTC" TO total_ttc;

ALTER TABLE
  "Quotations" RENAME COLUMN "tvaAmount" TO tva_amount;

ALTER TABLE
  "Quotations" RENAME COLUMN "paymentDate" TO payment_date;

ALTER TABLE
  "Quotations" RENAME COLUMN "uploadUrl" TO upload_url;

ALTER TABLE
  "Quotations" RENAME COLUMN "CustomerId" TO customer_id;

ALTER TABLE
  "Quotations" RENAME COLUMN "RevenuId" TO revenu_id;

ALTER TABLE
  "Quotations" RENAME COLUMN "InvoiceId" TO invoice_id;

ALTER TABLE "Quotations"
RENAME TO quotation;