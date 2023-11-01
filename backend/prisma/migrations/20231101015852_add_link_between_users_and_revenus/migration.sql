/*
 Warnings:
 
 - You are about to drop the column `BankId` on the `Revenus` table. All the data in the column will be lost.
 
 */
-- DropForeignKey
ALTER TABLE
  "Banks" DROP CONSTRAINT "fk_bank_user";

-- DropForeignKey
ALTER TABLE
  "CashPots" DROP CONSTRAINT "fk_bank_user";

-- DropForeignKey
ALTER TABLE
  "Costs" DROP CONSTRAINT "Costs_BankId_fkey";

-- DropForeignKey
ALTER TABLE
  "Costs" DROP CONSTRAINT "Costs_CashPotId_fkey";

-- DropForeignKey
ALTER TABLE
  "Costs" DROP CONSTRAINT "Costs_RevenuId_fkey";

-- DropForeignKey
ALTER TABLE
  "Credits" DROP CONSTRAINT "Credits_BankId_fkey";

-- DropForeignKey
ALTER TABLE
  "Credits" DROP CONSTRAINT "Credits_CashPotId_fkey";

-- DropForeignKey
ALTER TABLE
  "Credits" DROP CONSTRAINT "Credits_RevenuId_fkey";

-- DropForeignKey
ALTER TABLE
  "CryptoCurrencies" DROP CONSTRAINT "fk_crypto_currency_user";

-- DropForeignKey
ALTER TABLE
  "Customers" DROP CONSTRAINT "fk_customer_user";

-- DropForeignKey
ALTER TABLE
  "InvoiceItems" DROP CONSTRAINT "InvoiceItems_InvoiceId_fkey";

-- DropForeignKey
ALTER TABLE
  "InvoiceItems" DROP CONSTRAINT "InvoiceItems_QuotationId_fkey";

-- DropForeignKey
ALTER TABLE
  "Invoices" DROP CONSTRAINT "Invoices_CustomerId_fkey";

-- DropForeignKey
ALTER TABLE
  "Invoices" DROP CONSTRAINT "Invoices_RevenuId_fkey";

-- DropForeignKey
ALTER TABLE
  "PaymentIntents" DROP CONSTRAINT "PaymentIntents_PaymentId_fkey";

-- DropForeignKey
ALTER TABLE
  "PaymentIntents" DROP CONSTRAINT "PaymentIntents_SubscriptionId_fkey";

-- DropForeignKey
ALTER TABLE
  "Quotations" DROP CONSTRAINT "Quotations_CustomerId_fkey";

-- DropForeignKey
ALTER TABLE
  "Quotations" DROP CONSTRAINT "Quotations_InvoiceId_fkey";

-- DropForeignKey
ALTER TABLE
  "Quotations" DROP CONSTRAINT "Quotations_RevenuId_fkey";

-- DropForeignKey
ALTER TABLE
  "Revenus" DROP CONSTRAINT "Revenus_BankId_fkey";

-- DropForeignKey
ALTER TABLE
  "Transactions" DROP CONSTRAINT "Transactions_CryptoCurrencyId_fkey";

-- DropForeignKey
ALTER TABLE
  "Transactions" DROP CONSTRAINT "Transactions_RevenuId_fkey";

-- AlterTable
ALTER TABLE
  "Revenus"
ADD
  COLUMN "UserId" INTEGER;

-- InitValues
UPDATE
  "Revenus"
SET
  "UserId" = "Banks"."UserId"
FROM
  "Banks"
WHERE
  "Revenus"."BankId" = "Banks"."id";

-- AlterTable
ALTER TABLE
  "Revenus" DROP COLUMN "BankId";

-- AddForeignKey
ALTER TABLE
  "Costs"
ADD
  CONSTRAINT "Costs_RevenuId_fkey" FOREIGN KEY ("RevenuId") REFERENCES "Revenus"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "Costs"
ADD
  CONSTRAINT "Costs_CashPotId_fkey" FOREIGN KEY ("CashPotId") REFERENCES "CashPots"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "Costs"
ADD
  CONSTRAINT "Costs_BankId_fkey" FOREIGN KEY ("BankId") REFERENCES "Banks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "Credits"
ADD
  CONSTRAINT "Credits_RevenuId_fkey" FOREIGN KEY ("RevenuId") REFERENCES "Revenus"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "Credits"
ADD
  CONSTRAINT "Credits_CashPotId_fkey" FOREIGN KEY ("CashPotId") REFERENCES "CashPots"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "Credits"
ADD
  CONSTRAINT "Credits_BankId_fkey" FOREIGN KEY ("BankId") REFERENCES "Banks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "CryptoCurrencies"
ADD
  CONSTRAINT "fk_crypto_currency_user" FOREIGN KEY ("UserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "Customers"
ADD
  CONSTRAINT "fk_customer_user" FOREIGN KEY ("UserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "InvoiceItems"
ADD
  CONSTRAINT "InvoiceItems_InvoiceId_fkey" FOREIGN KEY ("InvoiceId") REFERENCES "Invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "InvoiceItems"
ADD
  CONSTRAINT "InvoiceItems_QuotationId_fkey" FOREIGN KEY ("QuotationId") REFERENCES "Quotations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "Invoices"
ADD
  CONSTRAINT "Invoices_CustomerId_fkey" FOREIGN KEY ("CustomerId") REFERENCES "Customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "Invoices"
ADD
  CONSTRAINT "Invoices_RevenuId_fkey" FOREIGN KEY ("RevenuId") REFERENCES "Revenus"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "Quotations"
ADD
  CONSTRAINT "Quotations_CustomerId_fkey" FOREIGN KEY ("CustomerId") REFERENCES "Customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "Quotations"
ADD
  CONSTRAINT "Quotations_InvoiceId_fkey" FOREIGN KEY ("InvoiceId") REFERENCES "Invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "Quotations"
ADD
  CONSTRAINT "Quotations_RevenuId_fkey" FOREIGN KEY ("RevenuId") REFERENCES "Revenus"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "Revenus"
ADD
  CONSTRAINT "Revenus_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "Transactions"
ADD
  CONSTRAINT "Transactions_CryptoCurrencyId_fkey" FOREIGN KEY ("CryptoCurrencyId") REFERENCES "CryptoCurrencies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "Transactions"
ADD
  CONSTRAINT "Transactions_RevenuId_fkey" FOREIGN KEY ("RevenuId") REFERENCES "Revenus"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "Banks"
ADD
  CONSTRAINT "fk_bank_user" FOREIGN KEY ("UserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "PaymentIntents"
ADD
  CONSTRAINT "PaymentIntents_PaymentId_fkey" FOREIGN KEY ("PaymentId") REFERENCES "Payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "PaymentIntents"
ADD
  CONSTRAINT "PaymentIntents_SubscriptionId_fkey" FOREIGN KEY ("SubscriptionId") REFERENCES "Subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
  "CashPots"
ADD
  CONSTRAINT "fk_bank_user" FOREIGN KEY ("UserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;