ALTER TABLE
  "cost_category" RENAME COLUMN "createdAt" TO created_at;

ALTER TABLE
  "cost_category" RENAME COLUMN "updatedAt" TO updated_at;

ALTER TABLE
  "credit_category" RENAME COLUMN "createdAt" TO created_at;

ALTER TABLE
  "credit_category" RENAME COLUMN "updatedAt" TO updated_at;
  
ALTER TABLE asset
ADD COLUMN creation_date TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE asset
SET creation_date = created_at;