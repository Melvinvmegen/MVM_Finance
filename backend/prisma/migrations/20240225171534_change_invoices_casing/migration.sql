ALTER TABLE
  "Invoices" RENAME COLUMN "firstName" TO first_name;

ALTER TABLE
  "Invoices" RENAME COLUMN "lastName" TO last_name;

ALTER TABLE
  "Invoices" RENAME COLUMN "vatNumber" TO vat_number;

ALTER TABLE
  "Invoices" RENAME COLUMN "tvaApplicable" TO tva_applicable;

ALTER TABLE
  "Invoices" RENAME COLUMN "totalTTC" TO total_ttc;

ALTER TABLE
  "Invoices" RENAME COLUMN "tvaAmount" TO tva_amount;

ALTER TABLE
  "Invoices" RENAME COLUMN "paymentDate" TO payment_date;

ALTER TABLE
  "Invoices" RENAME COLUMN "uploadUrl" TO upload_url;

ALTER TABLE
  "Invoices" RENAME COLUMN "totalDue" TO total_due;

ALTER TABLE
  "Invoices" RENAME COLUMN "CustomerId" TO customer_id;

ALTER TABLE
  "Invoices" RENAME COLUMN "RevenuId" TO revenu_id;

ALTER TABLE "Invoices"
RENAME TO invoice;