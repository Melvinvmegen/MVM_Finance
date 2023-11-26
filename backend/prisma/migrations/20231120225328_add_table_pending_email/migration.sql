-- CreateTable
CREATE TABLE "PendingEmail" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recipientEmail" VARCHAR(100) NOT NULL,
    "fromName" VARCHAR(100) NOT NULL,
    "fromAddress" VARCHAR(100) NOT NULL,
    "subject" VARCHAR(100) NOT NULL,
    "bbcRecipientEmail" VARCHAR(100) NOT NULL,
    "content" VARCHAR(400) NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "InvoiceId" INTEGER,
    "QuotationId" INTEGER,
    "UserId" INTEGER,
    CONSTRAINT "PendingEmail_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE
    "PendingEmail"
ADD
    CONSTRAINT "PendingEmail_InvoiceId_fkey" FOREIGN KEY ("InvoiceId") REFERENCES "Invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
    "PendingEmail"
ADD
    CONSTRAINT "PendingEmail_QuotationId_fkey" FOREIGN KEY ("QuotationId") REFERENCES "Quotations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE
    "PendingEmail"
ADD
    CONSTRAINT "PendingEmail_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddColumn
ALTER TABLE
    "CronTask"
ADD
    COLUMN "PendingEmailId" INTEGER;

ALTER TABLE
    "CronTask"
ADD
    CONSTRAINT "CronTask_PendingEmailId_fkey" FOREIGN KEY ("PendingEmailId") REFERENCES "PendingEmail"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- CreateIndex
CREATE UNIQUE INDEX "CronTask_PendingEmailId_key" ON "CronTask"("PendingEmailId");