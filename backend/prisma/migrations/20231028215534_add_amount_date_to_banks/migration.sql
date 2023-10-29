-- AlterTable
ALTER TABLE
  "Banks"
ADD
  COLUMN "amountDate" TIMESTAMP(3)
AFTER
  amount;