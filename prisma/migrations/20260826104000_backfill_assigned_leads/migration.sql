UPDATE "Lead"
SET "stage" = 'ASSIGNED',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "stage" = 'NEW'
  AND "assignedToId" IS NOT NULL;
