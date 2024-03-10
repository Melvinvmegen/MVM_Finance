ALTER TABLE
  "Withdrawal" RENAME COLUMN "exchangeFees" TO exchange_fees;

ALTER TABLE
  "Withdrawal" RENAME COLUMN "RevenuId" TO revenu_id;

ALTER TABLE "Withdrawal"
RENAME TO withdrawal;