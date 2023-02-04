-- CreateEnum
CREATE TYPE "CostCategory" AS ENUM ('GENERAL', 'TAX', 'INTERESTS', 'TRIP', 'HEALTH', 'SERVICES', 'HOUSING', 'TODEFINE');

-- CreateEnum
CREATE TYPE "CreditCategory" AS ENUM ('SALARY', 'REFUND', 'CRYPTO', 'STOCK', 'RENTAL');

-- CreateTable
CREATE TABLE "Costs" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "RevenuId" INTEGER NOT NULL,
    "tvaAmount" DOUBLE PRECISION,
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
    "refund" BOOLEAN DEFAULT true,
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

    CONSTRAINT "CryptoCurrencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customers" (
    "id" SERIAL NOT NULL,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "company" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255),
    "city" VARCHAR(255),
    "siret" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- AddForeignKey
ALTER TABLE "Costs" ADD CONSTRAINT "Costs_RevenuId_fkey" FOREIGN KEY ("RevenuId") REFERENCES "Revenus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credits" ADD CONSTRAINT "Credits_RevenuId_fkey" FOREIGN KEY ("RevenuId") REFERENCES "Revenus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_CryptoCurrencyId_fkey" FOREIGN KEY ("CryptoCurrencyId") REFERENCES "CryptoCurrencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_RevenuId_fkey" FOREIGN KEY ("RevenuId") REFERENCES "Revenus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
