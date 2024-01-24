/*
 Warnings:
 
 - You are about to drop the column `CashPotId` on the `Costs` table. All the data in the column will be lost.
 - You are about to drop the column `CashPotId` on the `Credits` table. All the data in the column will be lost.
 - You are about to drop the `CashPots` table. If the table is not empty, all the data it contains will be lost.
 
 */
INSERT INTO
  "asset_type" (
    name,
    description,
    fixed_interest_rate,
    interest_rate,
    min_cap,
    cap,
    duration
  )
VALUES
  (
    'Cash',
    'Cash handling asset',
    false,
    null,
    null,
    null,
    'unlimited'
  );

INSERT INTO
  "asset" (
    created_at,
    updated_at,
    name,
    amount,
    amount_date,
    user_id,
    asset_type_id
  )
SELECT
  "createdAt",
  "updatedAt",
  name,
  amount,
  "amountDate",
  "UserId",
  9
FROM
  "CashPots"
ORDER BY
  id ASC;

UPDATE
  "Costs"
SET
  "asset_id" = 8
WHERE
  "CashPotId" IS NOT NULL
  AND "asset_id" IS NULL;

UPDATE
  "Credits"
SET
  "asset_id" = 8
WHERE
  "CashPotId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE
  "CashPots" DROP CONSTRAINT "fk_cashpot_user";

-- DropForeignKey
ALTER TABLE
  "Costs" DROP CONSTRAINT "Costs_CashPotId_fkey";

-- DropForeignKey
ALTER TABLE
  "Credits" DROP CONSTRAINT "Credits_CashPotId_fkey";

-- AlterTable
ALTER TABLE
  "Costs" DROP COLUMN "CashPotId";

-- AlterTable
ALTER TABLE
  "Credits" DROP COLUMN "CashPotId";

-- DropTable
DROP TABLE "CashPots";