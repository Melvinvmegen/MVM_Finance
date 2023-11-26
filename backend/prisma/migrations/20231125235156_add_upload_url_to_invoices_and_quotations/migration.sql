-- AlterTable
ALTER TABLE
  "Invoices"
ADD
  COLUMN "uploadUrl" VARCHAR(255);

-- AlterTable
ALTER TABLE
  "Quotations"
ADD
  COLUMN "uploadUrl" VARCHAR(255);