ALTER TABLE
  "CryptoCurrencies" RENAME COLUMN "pricePurchase" TO price_purchase;

ALTER TABLE
  "CryptoCurrencies" RENAME COLUMN "priceChange" TO price_change;

ALTER TABLE
  "CryptoCurrencies" RENAME COLUMN "UserId" TO user_id;

ALTER TABLE "CryptoCurrencies"
RENAME TO crypto_currency;