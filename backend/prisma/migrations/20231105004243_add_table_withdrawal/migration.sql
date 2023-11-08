/*
 Warnings:
 
 - A unique constraint covering the columns `[WithdrawalId]` on the table `Costs` will be added. If there are existing duplicate values, this will fail.
 - A unique constraint covering the columns `[WithdrawalId]` on the table `Credits` will be added. If there are existing duplicate values, this will fail.
 
 */
-- AlterTable
ALTER TABLE
  "Costs"
ADD
  COLUMN "WithdrawalId" INTEGER;

-- AlterTable
ALTER TABLE
  "Credits"
ADD
  COLUMN "WithdrawalId" INTEGER;

-- CreateTable
CREATE TABLE "Withdrawal" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "name" VARCHAR(45) NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "exchangeFees" DOUBLE PRECISION NOT NULL,
  "RevenuId" INTEGER NOT NULL,
  CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Costs_WithdrawalId_key" ON "Costs"("WithdrawalId");

-- CreateIndex
CREATE UNIQUE INDEX "Credits_WithdrawalId_key" ON "Credits"("WithdrawalId");

-- RenameForeignKey
ALTER TABLE
  "CashPots" RENAME CONSTRAINT "fk_bank_user" TO "fk_cashpot_user";

-- AddForeignKey
ALTER TABLE
  "Costs"
ADD
  CONSTRAINT "Costs_WithdrawalId_fkey" FOREIGN KEY ("WithdrawalId") REFERENCES "Withdrawal"("id") ON DELETE CASCADE ON UPDATE
SET
  NULL;

-- AddForeignKey
ALTER TABLE
  "Credits"
ADD
  CONSTRAINT "Credits_WithdrawalId_fkey" FOREIGN KEY ("WithdrawalId") REFERENCES "Withdrawal"("id") ON DELETE CASCADE ON UPDATE
SET
  NULL;

-- AddForeignKey
ALTER TABLE
  "Withdrawal"
ADD
  CONSTRAINT "fk_withdrawal_revenu" FOREIGN KEY ("RevenuId") REFERENCES "Revenus"("id") ON DELETE CASCADE ON UPDATE NO ACTION;