/*
 Warnings:
 
 - A unique constraint covering the columns `[vatNumber]` on the table `Customers` will be added. If there are existing duplicate values, this will fail.
 - A unique constraint covering the columns `[vatNumber]` on the table `Invoices` will be added. If there are existing duplicate values, this will fail.
 - A unique constraint covering the columns `[vatNumber]` on the table `Quotations` will be added. If there are existing duplicate values, this will fail.
 
 */
-- AlterTable
ALTER TABLE
  "Customers"
ADD
  COLUMN "vatNumber" VARCHAR(15);

-- AlterTable
ALTER TABLE
  "Invoices"
ADD
  COLUMN "vatNumber" VARCHAR(15);

-- AlterTable
ALTER TABLE
  "Quotations"
ADD
  COLUMN "vatNumber" VARCHAR(15);

-- CreateIndex
CREATE UNIQUE INDEX "Customers_vatNumber_key" ON "Customers"("vatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoices_vatNumber_key" ON "Invoices"("vatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Quotations_vatNumber_key" ON "Quotations"("vatNumber");