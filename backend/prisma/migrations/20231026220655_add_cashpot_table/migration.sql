/*
 Warnings:
 
 - Made the column `UserId` on table `Banks` required. This step will fail if there are existing NULL values in that column.
 
 */
-- AlterTable
ALTER TABLE
  "Banks"
ALTER COLUMN
  "UserId"
SET
  NOT NULL;

-- AlterTable
ALTER TABLE
  "Costs"
ADD
  COLUMN "CashPotId" INTEGER,
ADD
  COLUMN "paymentMean" TEXT NOT NULL DEFAULT 'CARD';

-- AlterTable
ALTER TABLE
  "Credits"
ADD
  COLUMN "CashPotId" INTEGER;

-- CreateTable
CREATE TABLE "CashPots" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "name" VARCHAR(45) NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "amountDate" TIMESTAMP(3) NULL,
  "UserId" INTEGER NOT NULL,
  CONSTRAINT "CashPots_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE
  "Costs"
ADD
  CONSTRAINT "Costs_CashPotId_fkey" FOREIGN KEY ("CashPotId") REFERENCES "CashPots"("id") ON DELETE
SET
  NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
  "Credits"
ADD
  CONSTRAINT "Credits_CashPotId_fkey" FOREIGN KEY ("CashPotId") REFERENCES "CashPots"("id") ON DELETE
SET
  NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE
  "CashPots"
ADD
  CONSTRAINT "fk_bank_user" FOREIGN KEY ("UserId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;