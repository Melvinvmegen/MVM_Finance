-- CreateTable
CREATE TABLE "CronTask" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dateIntervalType" VARCHAR(10) NOT NULL DEFAULT 'month',
    "dateIntervalValue" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "function" VARCHAR(50) NOT NULL,
    "errorMessage" VARCHAR(500),
    "tryCounts" INTEGER NOT NULL DEFAULT 0,
    "params" JSONB,
    "UserId" INTEGER,
    CONSTRAINT "CronTask_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE
    "CronTask"
ADD
    CONSTRAINT "CronTask_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;