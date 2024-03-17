-- AlterTable
ALTER TABLE
  revenu
ADD
  COLUMN "salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD
  COLUMN "salary_net" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD
  COLUMN "bnc_pro" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD
  COLUMN "bnc_net" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "withholding_tax_active" BOOLEAN NOT NULL DEFAULT false;

INSERT INTO
    credit_category (name, color)
VALUES
    ('INVOICE', '#8CE8E5');

UPDATE credit
SET credit_category_id = 16
WHERE credit.total = 6000 AND credit_category_id = 10;