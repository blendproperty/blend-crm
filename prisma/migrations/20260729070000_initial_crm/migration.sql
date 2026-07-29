CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'AGENT');
CREATE TYPE "LeadStage" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'VIEWING', 'NEGOTIATION', 'WON', 'LOST');
CREATE TYPE "LeadPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "ActivityType" AS ENUM ('NOTE', 'CALL', 'EMAIL', 'WHATSAPP', 'STATUS_CHANGE', 'ASSIGNMENT', 'VIEWING');
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'AGENT',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Website" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "domain" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Website_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Contact" (
  "id" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT,
  "email" TEXT,
  "normalizedEmail" TEXT,
  "phone" TEXT,
  "normalizedPhone" TEXT,
  "company" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Property" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "address" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "externalId" TEXT,
  "stage" "LeadStage" NOT NULL DEFAULT 'NEW',
  "priority" "LeadPriority" NOT NULL DEFAULT 'NORMAL',
  "message" TEXT,
  "sourcePage" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "firstRespondedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "lostReason" TEXT,
  "contactId" TEXT NOT NULL,
  "websiteId" TEXT NOT NULL,
  "propertyId" TEXT,
  "assignedToId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Activity" (
  "id" TEXT NOT NULL,
  "type" "ActivityType" NOT NULL,
  "content" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Task" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueAt" TIMESTAMP(3),
  "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
  "leadId" TEXT NOT NULL,
  "assigneeId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Website_slug_key" ON "Website"("slug");
CREATE UNIQUE INDEX "Contact_normalizedEmail_key" ON "Contact"("normalizedEmail");
CREATE UNIQUE INDEX "Contact_normalizedPhone_key" ON "Contact"("normalizedPhone");
CREATE INDEX "Contact_lastName_firstName_idx" ON "Contact"("lastName", "firstName");
CREATE UNIQUE INDEX "Property_reference_key" ON "Property"("reference");
CREATE UNIQUE INDEX "Lead_websiteId_externalId_key" ON "Lead"("websiteId", "externalId");
CREATE INDEX "Lead_stage_createdAt_idx" ON "Lead"("stage", "createdAt");
CREATE INDEX "Lead_assignedToId_stage_idx" ON "Lead"("assignedToId", "stage");
CREATE INDEX "Lead_contactId_idx" ON "Lead"("contactId");
CREATE INDEX "Activity_leadId_createdAt_idx" ON "Activity"("leadId", "createdAt");
CREATE INDEX "Task_assigneeId_status_dueAt_idx" ON "Task"("assigneeId", "status", "dueAt");
CREATE INDEX "Task_leadId_idx" ON "Task"("leadId");

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
