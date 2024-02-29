ALTER TABLE
  "Subscriptions" RENAME COLUMN "startDate" TO start_date;

ALTER TABLE
  "Subscriptions" RENAME COLUMN "endDate" TO end_date;

ALTER TABLE
  "Subscriptions" RENAME COLUMN "proratedAmount" TO prorated_amount;

ALTER TABLE
  "Subscriptions" RENAME COLUMN "stripeId" TO stripe_id;

ALTER TABLE
  "Subscriptions" RENAME COLUMN "refundId" TO refund_id;

ALTER TABLE
  "Subscriptions" RENAME COLUMN "CustomerId" TO customer_id;

ALTER TABLE "Subscriptions"
RENAME TO subscription;