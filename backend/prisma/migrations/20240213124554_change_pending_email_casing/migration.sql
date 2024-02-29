ALTER TABLE
  "PendingEmail" RENAME COLUMN "recipientEmail" TO recipient_email;

ALTER TABLE
  "PendingEmail" RENAME COLUMN "fromName" TO from_name;

ALTER TABLE
  "PendingEmail" RENAME COLUMN "fromAddress" TO from_address;

ALTER TABLE
  "PendingEmail" RENAME COLUMN "bbcRecipientEmail" TO bbc_recipient_email;

ALTER TABLE
  "PendingEmail" RENAME COLUMN "InvoiceId" TO invoice_id;

ALTER TABLE
  "PendingEmail" RENAME COLUMN "QuotationId" TO quotation_id;

ALTER TABLE
  "PendingEmail" RENAME COLUMN "UserId" TO user_id;

ALTER TABLE "PendingEmail"
RENAME TO pending_email;