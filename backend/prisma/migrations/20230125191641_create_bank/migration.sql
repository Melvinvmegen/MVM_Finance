CREATE TABLE "Banks" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(45) NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Banks_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Revenus"
  ADD "BankId" INTEGER DEFAULT NULL,
  ADD FOREIGN KEY ("BankId") REFERENCES "Banks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE "Revenus"
  SET "BankId" = 1
  WHERE "BankId" IS NULL;