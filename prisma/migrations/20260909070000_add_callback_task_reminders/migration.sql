CREATE TYPE "TaskType" AS ENUM ('GENERAL', 'CALLBACK');

ALTER TABLE "Task"
ADD COLUMN "type" "TaskType" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN "reminderSentAt" TIMESTAMP(3);

CREATE INDEX "Task_type_status_dueAt_reminderSentAt_idx"
ON "Task"("type", "status", "dueAt", "reminderSentAt");
