UPDATE "Customers"
  SET "UserId" = 1
  WHERE "UserId" IS NULL;

UPDATE "Banks"
  SET "UserId" = 1
  WHERE "UserId" IS NULL;

UPDATE "CryptoCurrencies"
  SET "UserId" = 1
  WHERE "UserId" IS NULL;