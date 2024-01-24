-- AlterTable
ALTER TABLE
  "CryptoCurrencies"
ADD
  COLUMN "asset_id" INTEGER;

-- AddForeignKey
ALTER TABLE
  "CryptoCurrencies"
ADD
  CONSTRAINT "CryptoCurrencies_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

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
    'Crypto',
    'Crypto handling asset',
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
VALUES
  (
    NOW(),
    NOW(),
    'Crypto',
    0,
    NOW(),
    1,
    10
  );

UPDATE
  "CryptoCurrencies"
SET
  asset_id = 9