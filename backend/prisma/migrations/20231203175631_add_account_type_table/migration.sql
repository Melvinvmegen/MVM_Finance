-- CreateTable
CREATE TABLE "AccountType" (
  "id" SERIAL NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name" VARCHAR(50) NOT NULL,
  "description" VARCHAR(300) NOT NULL,
  "fixedInterestRate" BOOLEAN NOT NULL DEFAULT true,
  "interestRate" INTEGER,
  "minCap" INTEGER,
  "cap" INTEGER,
  "duration" TEXT NOT NULL DEFAULT 'unlimited',
  CONSTRAINT "AccountType_pkey" PRIMARY KEY ("id")
);

-- InsertData
INSERT INTO
  "AccountType" (
    "name",
    "description",
    "interestRate",
    "cap",
    "minCap",
    "duration",
    "fixedInterestRate"
  )
VALUES
  (
    'Current account',
    'Financial account for everyday transactions',
    0,
    null,
    null,
    'unlimited',
    true
  );

INSERT INTO
  "AccountType" (
    "name",
    "description",
    "interestRate",
    "cap",
    "minCap",
    "duration",
    "fixedInterestRate"
  )
VALUES
  (
    'Livret A',
    'Tax free saving account with a fixed interet rate',
    3,
    22950,
    10,
    'unlimited',
    true
  );

INSERT INTO
  "AccountType" (
    "name",
    "description",
    "interestRate",
    "cap",
    "minCap",
    "duration",
    "fixedInterestRate"
  )
VALUES
  (
    'Livret développement durable et solidaire',
    'Tax free saving account with a fixed interet rate',
    3,
    12000,
    15,
    'unlimited',
    true
  );

INSERT INTO
  "AccountType" (
    "name",
    "description",
    "interestRate",
    "cap",
    "minCap",
    "duration",
    "fixedInterestRate"
  )
VALUES
  (
    'Plan épargne logement',
    'Saving account with an interet rate indexed on bank interest rates, amount is blocked up to the end of the contract which also allows for an easier loan process',
    2,
    61200,
    225,
    '4 years reconductible up to 10',
    true
  );

INSERT INTO
  "AccountType" (
    "name",
    "description",
    "interestRate",
    "cap",
    "minCap",
    "duration",
    "fixedInterestRate"
  )
VALUES
  (
    'Compte épargne logement',
    'Contract based saving account with a unique deposit. Interest rate is based a few variables which also allows for an easier loan process',
    2,
    15300,
    300,
    '18 months minimum',
    true
  );

INSERT INTO
  "AccountType" (
    "name",
    "description",
    "interestRate",
    "cap",
    "minCap",
    "duration",
    "fixedInterestRate"
  )
VALUES
  (
    'Compte à terme',
    'Contract based saving account with a unique deposit. Interest rate is based a few variables',
    null,
    12000,
    300,
    'Fixed at the beginning',
    false
  );

INSERT INTO
  "AccountType" (
    "name",
    "description",
    "interestRate",
    "cap",
    "minCap",
    "duration",
    "fixedInterestRate"
  )
VALUES
  (
    'Compte sur livret pro',
    'Boursorama saving account with a fixed interest rate',
    2.5,
    null,
    10,
    'unlimited',
    true
  );

INSERT INTO
  "AccountType" (
    "name",
    "description",
    "interestRate",
    "cap",
    "minCap",
    "duration",
    "fixedInterestRate"
  )
VALUES
  (
    'Plan epargne action',
    'Boursorama saving account with tax advantages after 5 years',
    null,
    150000,
    5000,
    'unlimited',
    false
  );

-- AlterTable
ALTER TABLE
  "Banks"
ADD
  COLUMN "AccountTypeId" INTEGER,
ADD
  COLUMN "interestRate" INTEGER;

-- AddForeignKey
ALTER TABLE
  "Banks"
ADD
  CONSTRAINT "fk_bank_account_type" FOREIGN KEY ("AccountTypeId") REFERENCES "AccountType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- MigrateBanks
UPDATE
  "Banks"
SET
  "AccountTypeId" = 1