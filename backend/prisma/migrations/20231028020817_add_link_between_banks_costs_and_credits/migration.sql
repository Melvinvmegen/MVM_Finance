-- AlterTable
ALTER TABLE
  "Costs"
ADD
  COLUMN "BankId" INTEGER;

-- AlterTable
ALTER TABLE
  "Credits"
ADD
  COLUMN "BankId" INTEGER;

-- AddForeignKey
ALTER TABLE
  "Costs"
ADD
  CONSTRAINT "Costs_BankId_fkey" FOREIGN KEY ("BankId") REFERENCES "Banks"("id") ON DELETE
SET
  NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "Credits"
ADD
  CONSTRAINT "Credits_BankId_fkey" FOREIGN KEY ("BankId") REFERENCES "Banks"("id") ON DELETE
SET
  NULL ON UPDATE NO ACTION;

UPDATE
  "Costs"
SET
  "BankId" = (
    SELECT
      "Revenus"."BankId"
    FROM
      "Costs"
      JOIN "Revenus" ON "Costs"."RevenuId" = "Revenus"."id"
    LIMIT
      1
  );

UPDATE
  "Costs"
SET
  "BankId" = "Revenus"."BankId"
FROM
  "Revenus"
WHERE
  "Costs"."RevenuId" = "Revenus"."id";

UPDATE
  "Credits"
SET
  "BankId" = "Revenus"."BankId"
FROM
  "Revenus"
WHERE
  "Credits"."RevenuId" = "Revenus"."id";