ALTER TABLE
  "Credits" RENAME COLUMN "RevenuId" TO revenu_id;

ALTER TABLE
  "Credits" RENAME COLUMN "WithdrawalId" TO withdrawal_id;

ALTER TABLE
  "Credits" RENAME COLUMN "CreditCategoryId" TO credit_category_id;

ALTER TABLE "Credits"
RENAME TO credit;