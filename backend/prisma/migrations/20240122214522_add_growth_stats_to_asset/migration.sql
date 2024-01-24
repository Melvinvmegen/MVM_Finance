-- AlterTable
ALTER TABLE
  "asset"
ADD
  COLUMN "growth_last_month" FLOAT NOT NULL DEFAULT 0,
ADD
  COLUMN "growth_last_six_months" FLOAT NOT NULL DEFAULT 0,
ADD
  COLUMN "growth_last_year" FLOAT NOT NULL DEFAULT 0;