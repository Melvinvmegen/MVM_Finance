ALTER TABLE
  "PaymentIntents" RENAME COLUMN "stripeId" TO stripe_id;

ALTER TABLE
  "PaymentIntents" RENAME COLUMN "PaymentId" TO payment_id;

ALTER TABLE
  "PaymentIntents" RENAME COLUMN "SubscriptionId" TO subscription_id;

ALTER TABLE "PaymentIntents"
RENAME TO payment_intent;