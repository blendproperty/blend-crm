import Link from "next/link";

import { NewLeadForm } from "@/app/leads/new/new-lead-form";
import { CrmShell } from "@/components/crm-shell";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function NewLeadPage() {
  await requireUser();
  const websites = await db.website.findMany({
    where: { active: true, slug: { not: "manual" } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return (
    <CrmShell
      title="Add lead"
      eyebrow="Manual enquiry"
      actions={<Link href="/leads" className="text-sm font-bold text-[#168f69]">← Back to leads</Link>}
    >
      <div className="mx-auto max-w-3xl">
        <NewLeadForm websites={websites} />
      </div>
    </CrmShell>
  );
}
