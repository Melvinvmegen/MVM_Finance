ALTER TABLE
  "Costs" RENAME COLUMN "RevenuId" TO revenu_id;

ALTER TABLE
  "Costs" RENAME COLUMN "WithdrawalId" TO withdrawal_id;

ALTER TABLE
  "Costs" RENAME COLUMN "tvaAmount" TO tva_amount;

ALTER TABLE
  "Costs" RENAME COLUMN "paymentMean" TO payment_mean;

ALTER TABLE
  "Costs" RENAME COLUMN "CostCategoryId" TO cost_category_id;

ALTER TABLE "Costs"
RENAME TO cost;