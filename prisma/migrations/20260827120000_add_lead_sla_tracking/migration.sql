ALTER TABLE "Lead"
ADD COLUMN "slaReminderSentAt" TIMESTAMP(3),
ADD COLUMN "slaEscalatedAt" TIMESTAMP(3);

UPDATE "Lead" AS lead
SET "firstRespondedAt" = activity."firstActivityAt"
FROM (
  SELECT "leadId", MIN("createdAt") AS "firstActivityAt"
  FROM "Activity"
  WHERE "type" IN ('NOTE', 'CALL', 'EMAIL', 'WHATSAPP', 'VIEWING')
  GROUP BY "leadId"
) AS activity
WHERE lead.id = activity."leadId"
  AND lead."firstRespondedAt" IS NULL;

CREATE INDEX "Lead_firstRespondedAt_createdAt_idx"
ON "Lead"("firstRespondedAt", "createdAt");
