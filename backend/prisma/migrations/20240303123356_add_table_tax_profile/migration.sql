-- AlterTable
ALTER TABLE
  "investment_profile" DROP COLUMN "withholding_tax_active",
  ADD COLUMN "average_tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "tax_profile" (
  "id" SERIAL NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fiscal_revenu" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "parts_number" INTEGER NOT NULL DEFAULT 1,
  "salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "fees_declared" BOOLEAN NOT NULL DEFAULT false,
  "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "deduction_percent" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
  "salary_net" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "bnc_pro" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "bnc_net" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "income_global" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "income_net_global" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "income_taxable" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "decote" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "withholding_tax_active" BOOLEAN NOT NULL DEFAULT false,
  "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "tax_amount_net" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "tax_withholded" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "tax_rate_mean" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "tax_rate_marginal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "user_id" INTEGER NOT NULL,
  CONSTRAINT "tax_profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tax_profile_user_id_key" ON "tax_profile"("user_id");

-- AddForeignKey
ALTER TABLE
  tax_profile
ADD
  CONSTRAINT "tax_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO
  tax_profile (user_id)
SELECT
  id
FROM
  "user"
ORDER BY
  id ASC;