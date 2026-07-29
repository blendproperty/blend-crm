import Link from "next/link";

import { CrmShell } from "@/components/crm-shell";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

const stages = ["NEW", "CONTACTED", "QUALIFIED", "VIEWING", "NEGOTIATION"] as const;
const label = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

export default async function PipelinePage() {
  await requireUser();
  const leads = await db.lead.findMany({
    where: { stage: { in: [...stages] } },
    include: { contact: true, property: true, website: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <CrmShell title="Pipeline" eyebrow={`${leads.length} active opportunities`}>
      <div className="grid gap-4 overflow-x-auto pb-3 xl:grid-cols-5">
        {stages.map((stage) => {
          const stageLeads = leads.filter((lead) => lead.stage === stage);
          return (
            <section key={stage} className="min-w-[250px] rounded-xl bg-[#eaf0ed] p-3">
              <div className="flex items-center justify-between px-1 py-2">
                <h2 className="text-sm font-bold">{label(stage)}</h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold">{stageLeads.length}</span>
              </div>
              <div className="mt-2 space-y-3">
                {stageLeads.map((lead) => (
                  <Link key={lead.id} href={`/leads/${lead.id}`} className="block rounded-lg border border-[#dfe6e2] bg-white p-4 shadow-sm transition hover:-translate-y-0.5">
                    <p className="text-sm font-bold">{lead.contact.firstName} {lead.contact.lastName}</p>
                    <p className="mt-1 text-xs text-[#6f7d77]">{lead.property?.title ?? "General enquiry"}</p>
                    <div className="mt-3 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-[#8a958f]">
                      <span>{lead.website.name}</span>
                      <span>{label(lead.priority)}</span>
                    </div>
                  </Link>
                ))}
                {stageLeads.length === 0 && <p className="px-2 py-6 text-center text-xs text-[#7b8982]">No leads</p>}
              </div>
            </section>
          );
        })}
      </div>
    </CrmShell>
  );
}
