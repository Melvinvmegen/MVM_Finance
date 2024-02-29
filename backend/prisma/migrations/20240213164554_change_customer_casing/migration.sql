ALTER TABLE
  "Customers" RENAME COLUMN "firstName" TO first_name;

ALTER TABLE
  "Customers" RENAME COLUMN "lastName" TO last_name;

ALTER TABLE
  "Customers" RENAME COLUMN "vatNumber" TO vat_number;

ALTER TABLE
  "Customers" RENAME COLUMN "stripeId" TO stripe_id;

ALTER TABLE
  "Customers" RENAME COLUMN "UserId" TO user_id;

ALTER TABLE "Customers"
RENAME TO customer;