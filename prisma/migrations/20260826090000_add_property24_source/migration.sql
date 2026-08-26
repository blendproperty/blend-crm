INSERT INTO "Website" ("id", "name", "slug", "domain", "active", "createdAt", "updatedAt")
VALUES ('source_property24', 'Property24', 'property24', 'property24.com', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE
SET "name" = EXCLUDED."name",
    "domain" = EXCLUDED."domain",
    "active" = true,
    "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "Lead" AS lead
SET "websiteId" = website."id",
    "updatedAt" = CURRENT_TIMESTAMP
FROM "Website" AS website,
     "Website" AS current_source,
     "Property" AS property
WHERE website."slug" = 'property24'
  AND current_source."id" = lead."websiteId"
  AND current_source."slug" = 'manual'
  AND property."id" = lead."propertyId"
  AND LOWER(property."title") = 'property24';
