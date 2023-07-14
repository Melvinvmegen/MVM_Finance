-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('GENERAL', 'TAX', 'INTERESTS', 'TRIP', 'HEALTH', 'SERVICES', 'HOUSING', 'TODEFINE', 'INVESTMENT');

-- CreateEnum
CREATE TYPE "CreditCategory" AS ENUM ('SALARY', 'REFUND', 'CRYPTO', 'STOCK', 'RENTAL', 'TRANSFER');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('DRAFT', 'VALIDATED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentIntentStatus" AS ENUM ('DRAFT', 'CAPTURED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('DRAFT', 'CAPTURED', 'FAILED', 'REFUND_REQUESTED', 'REFUNDED');

-- CreateTable
CREATE TABLE "Costs" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "RevenuId" INTEGER NOT NULL,
    "tvaAmount" DOUBLE PRECISION,
    "recurrent" BOOLEAN NOT NULL DEFAULT false,
    "category" "CostCategory" NOT NULL DEFAULT 'TODEFINE',

    CONSTRAINT "Costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credits" (
    "id" SERIAL NOT NULL,
    "creditor" VARCHAR(255) NOT NULL,
    "reason" VARCHAR(255),
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "RevenuId" INTEGER NOT NULL,
    "category" "CreditCategory" NOT NULL DEFAULT 'REFUND',

    CONSTRAINT "Credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CryptoCurrencies" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "pricePurchase" DOUBLE PRECISION NOT NULL,
    "priceChange" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "category" VARCHAR(255),
    "profit" DOUBLE PRECISION,
    "sold" BOOLEAN NOT NULL DEFAULT false,
    "UserId" INTEGER,

    CONSTRAINT "CryptoCurrencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customers" (
    "id" SERIAL NOT NULL,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "company" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255),
    "address" VARCHAR(255),
    "city" VARCHAR(255),
    "siret" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripeId" TEXT,
    "UserId" INTEGER,

    CONSTRAINT "Customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItems" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "unit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "InvoiceId" INTEGER,
    "QuotationId" INTEGER,

    CONSTRAINT "InvoiceItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoices" (
    "id" SERIAL NOT NULL,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "company" VARCHAR(255),
    "address" VARCHAR(255),
    "city" VARCHAR(255),
    "paymentDate" TIMESTAMPTZ(6),
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paid" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "CustomerId" INTEGER NOT NULL,
    "RevenuId" INTEGER,
    "totalDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tvaApplicable" BOOLEAN NOT NULL DEFAULT false,
    "totalTTC" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tvaAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotations" (
    "id" SERIAL NOT NULL,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "company" VARCHAR(255),
    "address" VARCHAR(255),
    "city" VARCHAR(255),
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "CustomerId" INTEGER NOT NULL,
    "RevenuId" INTEGER,
    "cautionPaid" BOOLEAN NOT NULL DEFAULT false,
    "InvoiceId" INTEGER,
    "tvaApplicable" BOOLEAN NOT NULL DEFAULT false,
    "totalTTC" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tvaAmount" DOUBLE PRECISION DEFAULT 0,
    "paymentDate" TIMESTAMPTZ(6),

    CONSTRAINT "Quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshTokens" (
    "id" SERIAL NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiryDate" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "UserId" INTEGER NOT NULL,

    CONSTRAINT "RefreshTokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Revenus" (
    "id" SERIAL NOT NULL,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pro" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "perso" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "taxPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expense" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tva_collected" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tva_dispatched" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refund" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "BankId" INTEGER,
    "watchers" TEXT,

    CONSTRAINT "Revenus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transactions" (
    "id" SERIAL NOT NULL,
    "buyingDate" TIMESTAMPTZ(6),
    "exchange" VARCHAR(255),
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "CryptoCurrencyId" INTEGER,
    "RevenuId" INTEGER,

    CONSTRAINT "Transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cryptosModuleActive" BOOLEAN NOT NULL DEFAULT true,
    "customersModuleActive" BOOLEAN NOT NULL DEFAULT true,
    "revenusModuleActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banks" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(45) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "UserId" INTEGER,

    CONSTRAINT "Banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscriptions" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'DRAFT',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "proratedAmount" DOUBLE PRECISION,
    "stripeId" TEXT NOT NULL,
    "refundId" TEXT,
    "CustomerId" INTEGER NOT NULL,

    CONSTRAINT "Subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentIntents" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "PaymentIntentStatus" NOT NULL DEFAULT 'DRAFT',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stripeId" TEXT NOT NULL,
    "PaymentId" INTEGER,
    "SubscriptionId" INTEGER,

    CONSTRAINT "PaymentIntents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payments" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'DRAFT',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "billingAddress" TEXT NOT NULL,
    "billingZipCode" TEXT NOT NULL,
    "billingCity" TEXT NOT NULL,
    "billingCountry" TEXT NOT NULL,
    "paymentTries" INTEGER NOT NULL DEFAULT 1,
    "stripeRefundId" TEXT,
    "stripePriceId" TEXT,
    "CustomerId" INTEGER NOT NULL,
    "UserId" INTEGER NOT NULL,
    "InvoiceId" INTEGER,

    CONSTRAINT "Payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customers_stripeId_key" ON "Customers"("stripeId");

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriptions_stripeId_key" ON "Subscriptions"("stripeId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriptions_refundId_key" ON "Subscriptions"("refundId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriptions_CustomerId_key" ON "Subscriptions"("CustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntents_stripeId_key" ON "PaymentIntents"("stripeId");

-- CreateIndex
CREATE UNIQUE INDEX "Payments_stripeRefundId_key" ON "Payments"("stripeRefundId");

-- AddForeignKey
ALTER TABLE "Costs" ADD CONSTRAINT "Costs_RevenuId_fkey" FOREIGN KEY ("RevenuId") REFERENCES "Revenus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credits" ADD CONSTRAINT "Credits_RevenuId_fkey" FOREIGN KEY ("RevenuId") REFERENCES "Revenus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CryptoCurrencies" ADD CONSTRAINT "fk_crypto_currency_user" FOREIGN KEY ("UserId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Customers" ADD CONSTRAINT "fk_customer_user" FOREIGN KEY ("UserId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "InvoiceItems" ADD CONSTRAINT "InvoiceItems_InvoiceId_fkey" FOREIGN KEY ("InvoiceId") REFERENCES "Invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItems" ADD CONSTRAINT "InvoiceItems_QuotationId_fkey" FOREIGN KEY ("QuotationId") REFERENCES "Quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoices" ADD CONSTRAINT "Invoices_CustomerId_fkey" FOREIGN KEY ("CustomerId") REFERENCES "Customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoices" ADD CONSTRAINT "Invoices_RevenuId_fkey" FOREIGN KEY ("RevenuId") REFERENCES "Revenus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotations" ADD CONSTRAINT "Quotations_CustomerId_fkey" FOREIGN KEY ("CustomerId") REFERENCES "Customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotations" ADD CONSTRAINT "Quotations_InvoiceId_fkey" FOREIGN KEY ("InvoiceId") REFERENCES "Invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotations" ADD CONSTRAINT "Quotations_RevenuId_fkey" FOREIGN KEY ("RevenuId") REFERENCES "Revenus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshTokens" ADD CONSTRAINT "RefreshTokens_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revenus" ADD CONSTRAINT "Revenus_BankId_fkey" FOREIGN KEY ("BankId") REFERENCES "Banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_CryptoCurrencyId_fkey" FOREIGN KEY ("CryptoCurrencyId") REFERENCES "CryptoCurrencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_RevenuId_fkey" FOREIGN KEY ("RevenuId") REFERENCES "Revenus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Banks" ADD CONSTRAINT "fk_bank_user" FOREIGN KEY ("UserId") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Subscriptions" ADD CONSTRAINT "fk_subscription_customer" FOREIGN KEY ("CustomerId") REFERENCES "Customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PaymentIntents" ADD CONSTRAINT "PaymentIntents_PaymentId_fkey" FOREIGN KEY ("PaymentId") REFERENCES "Payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentIntents" ADD CONSTRAINT "PaymentIntents_SubscriptionId_fkey" FOREIGN KEY ("SubscriptionId") REFERENCES "Subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payments" ADD CONSTRAINT "fk_subscription_customer" FOREIGN KEY ("CustomerId") REFERENCES "Customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Payments" ADD CONSTRAINT "fk_subscription_invoice" FOREIGN KEY ("InvoiceId") REFERENCES "Invoices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

