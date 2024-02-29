ALTER TABLE
  "Payments" RENAME COLUMN "billingAddress" TO billing_address;

ALTER TABLE
  "Payments" RENAME COLUMN "billingZipCode" TO billing_zip_code;

ALTER TABLE
  "Payments" RENAME COLUMN "billingCity" TO billing_city;

ALTER TABLE
  "Payments" RENAME COLUMN "billingCountry" TO billing_country;

ALTER TABLE
  "Payments" RENAME COLUMN "paymentTries" TO payment_tries;

ALTER TABLE
  "Payments" RENAME COLUMN "stripeRefundId" TO stripe_refund_id;

ALTER TABLE
  "Payments" RENAME COLUMN "stripePriceId" TO stripe_price_id;

ALTER TABLE
  "Payments" RENAME COLUMN "CustomerId" TO customer_id;

ALTER TABLE
  "Payments" RENAME COLUMN "UserId" TO user_id;

ALTER TABLE
  "Payments" RENAME COLUMN "InvoiceId" TO invoice_id;

ALTER TABLE "Payments"
RENAME TO payment;