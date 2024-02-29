ALTER TABLE
  "CronTask" RENAME COLUMN "dateIntervalType" TO date_interval_type;

ALTER TABLE
  "CronTask" RENAME COLUMN "dateIntervalValue" TO date_interval_value;

ALTER TABLE
  "CronTask" RENAME COLUMN "errorMessage" TO error_message;

ALTER TABLE
  "CronTask" RENAME COLUMN "tryCounts" TO try_counts;

ALTER TABLE
  "CronTask" RENAME COLUMN "UserId" TO user_id;

ALTER TABLE
  "CronTask" RENAME COLUMN "PendingEmailId" TO pending_email_id;

ALTER TABLE "CronTask"
RENAME TO cron_task;