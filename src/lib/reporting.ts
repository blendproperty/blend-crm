import type { Prisma } from "@/generated/prisma/client";

// Keep closed QA records in the audit trail, outside commercial summaries.
export const reportableLeadWhere = {
  OR: [{ killedReason: null }, { NOT: { killedReason: { startsWith: "TEST ONLY" } } }],
} satisfies Prisma.LeadWhereInput;
