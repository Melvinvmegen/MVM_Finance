/*
 Warnings:
 
 - You are about to drop the column `account_type_id` on the `asset` table. All the data in the column will be lost.
 - You are about to drop the `AccountType` table. If the table is not empty, all the data it contains will be lost.
 
 */
-- CreateTable
CREATE TABLE "asset_type" (
  "id" SERIAL NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name" VARCHAR(50) NOT NULL,
  "description" VARCHAR(300) NOT NULL,
  "fixed_interest_rate" BOOLEAN NOT NULL DEFAULT true,
  "interest_rate" INTEGER,
  "min_cap" INTEGER,
  "cap" INTEGER,
  "duration" TEXT NOT NULL DEFAULT 'unlimited',
  CONSTRAINT "asset_type_pkey" PRIMARY KEY ("id")
);

INSERT INTO
  "asset_type" (
    id,
    created_at,
    updated_at,
    name,
    description,
    fixed_interest_rate,
    interest_rate,
    min_cap,
    cap,
    duration
  )
SELECT
  id,
  "createdAt",
  "updatedAt",
  name,
  description,
  "fixedInterestRate",
  "interestRate",
  "minCap",
  "cap",
  "duration"
FROM
  "AccountType"
ORDER BY
  id ASC;

-- AlterTable
ALTER TABLE
  "asset"
ADD
  COLUMN "asset_type_id" INTEGER;

UPDATE
  "asset"
SET
  "asset_type_id" = "account_type_id";

-- AddForeignKey
ALTER TABLE
  "asset"
ADD
  CONSTRAINT "fk_asset_asset_type" FOREIGN KEY ("asset_type_id") REFERENCES "asset_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- DropForeignKey
ALTER TABLE
  "asset" DROP CONSTRAINT "fk_asset_account_type";

-- AlterTable
ALTER TABLE
  "asset" DROP COLUMN "account_type_id";

-- DropTable
DROP TABLE "AccountType";