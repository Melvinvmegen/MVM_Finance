/*
 Warnings:
 
 - You are about to drop the column `BankId` on the `Costs` table. All the data in the column will be lost.
 - You are about to drop the column `BankId` on the `Credits` table. All the data in the column will be lost.
 - You are about to drop the `Banks` table. If the table is not empty, all the data it contains will be lost.
 
 */
-- AlterTable
ALTER TABLE
  "Costs"
ADD
  COLUMN "asset_id" INTEGER;

-- AlterTable
ALTER TABLE
  "Credits"
ADD
  COLUMN "asset_id" INTEGER;

-- CreateTable
CREATE TABLE "asset" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(45) NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "amount_date" TIMESTAMP(3),
  "interest_rate" INTEGER,
  "user_id" INTEGER NOT NULL,
  "account_type_id" INTEGER,
  CONSTRAINT "asset_pkey" PRIMARY KEY ("id")
);

INSERT INTO
  "asset" (
    id,
    name,
    amount,
    created_at,
    updated_at,
    amount_date,
    interest_rate,
    user_id,
    account_type_id
  )
SELECT
  id,
  name,
  amount,
  "createdAt",
  "updatedAt",
  "amountDate",
  "interestRate",
  "UserId",
  "AccountTypeId"
FROM
  "Banks"
ORDER BY
  id ASC;

UPDATE
  "Costs"
SET
  "asset_id" = (
    SELECT
      "id"
    FROM
      "Banks"
    WHERE
      "Banks"."id" = "Costs"."BankId"
  );

UPDATE
  "Credits"
SET
  "asset_id" = (
    SELECT
      "id"
    FROM
      "Banks"
    WHERE
      "Banks"."id" = "Credits"."BankId"
  );

-- AddForeignKey
ALTER TABLE
  "Costs"
ADD
  CONSTRAINT "Costs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "Credits"
ADD
  CONSTRAINT "Credits_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "asset"
ADD
  CONSTRAINT "fk_asset_account_type" FOREIGN KEY ("account_type_id") REFERENCES "AccountType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "asset"
ADD
  CONSTRAINT "fk_asset_user" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE
  "Costs" DROP COLUMN "BankId";

ALTER TABLE
  "Credits" DROP COLUMN "BankId";

-- DropForeignKey
ALTER TABLE
  "Banks" DROP CONSTRAINT "fk_bank_account_type";

-- DropForeignKey
ALTER TABLE
  "Banks" DROP CONSTRAINT "fk_bank_user";

-- DropTable
DROP TABLE "Banks";