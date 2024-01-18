/*
 Warnings:
 
 - You are about to drop the column `investment_capacity` on the `Revenus` table. All the data in the column will be lost.
 - You are about to drop the column `investment_goal` on the `Users` table. All the data in the column will be lost.
 - You are about to drop the column `withholding_tax_active` on the `Users` table. All the data in the column will be lost.
 
 */
-- AlterTable
ALTER TABLE
  "Revenus" DROP COLUMN "investment_capacity";

-- AlterTable
ALTER TABLE
  "Users" DROP COLUMN "investment_goal",
  DROP COLUMN "withholding_tax_active";

-- CreateTable
CREATE TABLE "investment_profile" (
  "id" SERIAL NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "withholding_tax_active" BOOLEAN NOT NULL DEFAULT true,
  "investment_goal" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
  "average_revenu_pro" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "average_revenu_perso" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "average_revenu_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "average_expense" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "average_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "average_investments" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "investment_capacity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "user_id" INTEGER NOT NULL,
  CONSTRAINT "investment_profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "investment_profile_user_id_key" ON "investment_profile"("user_id");

-- AddForeignKey
ALTER TABLE
  "investment_profile"
ADD
  CONSTRAINT "investment_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO
  investment_profile (user_id)
SELECT
  id
FROM
  "Users"
ORDER BY
  id ASC;