ALTER TABLE
  "Transactions" RENAME COLUMN "buyingDate" TO buying_date;

ALTER TABLE
  "Transactions" RENAME COLUMN "CryptoCurrencyId" TO crypto_currency_id;

ALTER TABLE
  "Transactions" RENAME COLUMN "RevenuId" TO revenu_id;

ALTER TABLE "Transactions"
RENAME TO "transaction";