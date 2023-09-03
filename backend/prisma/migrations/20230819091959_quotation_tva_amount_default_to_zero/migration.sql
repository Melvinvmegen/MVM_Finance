/*
  Warnings:

  - Made the column `tvaAmount` on table `Quotations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Quotations" ALTER COLUMN "tvaAmount" SET NOT NULL;
