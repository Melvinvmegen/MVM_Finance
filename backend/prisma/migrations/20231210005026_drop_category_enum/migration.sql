/*
 Warnings:
 
 - You are about to drop the column `category` on the `Costs` table. All the data in the column will be lost.
 - You are about to drop the column `category` on the `Credits` table. All the data in the column will be lost.
 
 */
-- AlterTable
ALTER TABLE
  "Costs" DROP COLUMN "category";

-- AlterTable
ALTER TABLE
  "Credits" DROP COLUMN "category";

-- DropEnum
DROP TYPE "CostCategory";

-- DropEnum
DROP TYPE "CreditCategory";