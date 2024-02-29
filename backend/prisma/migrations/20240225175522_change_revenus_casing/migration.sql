ALTER TABLE
  "Revenus" RENAME COLUMN "taxPercentage" TO tax_percentage;

ALTER TABLE
  "Revenus" RENAME COLUMN "UserId" TO user_id;

ALTER TABLE "Revenus"
RENAME TO revenu;