import Link from "next/link";

import { LeadsTable } from "@/app/leads/leads-table";
import { CrmShell } from "@/components/crm-shell";
import { db } from "@/lib/db";
import { leadStages, leadStageLabel } from "@/lib/lead-stage";
import { requireUser } from "@/lib/session";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string }>;
}) {
  await requireUser();
  const filters = await searchParams;
  const query = filters.q?.trim() ?? "";
  const stage = leadStages.includes(filters.stage as (typeof leadStages)[number])
    ? (filters.stage as (typeof leadStages)[number])
    : undefined;

  const [leads, killedCount] = await Promise.all([
    db.lead.findMany({
      where: {
        ...(stage ? { stage } : {}),
        ...(query
          ? {
              OR: [
                { contact: { firstName: { contains: query, mode: "insensitive" } } },
                { contact: { lastName: { contains: query, mode: "insensitive" } } },
                { contact: { email: { contains: query, mode: "insensitive" } } },
                { contact: { phone: { contains: query } } },
                { property: { title: { contains: query, mode: "insensitive" } } },
                { property: { reference: { contains: query, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: { contact: true, website: true, property: true, assignedTo: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.lead.count({ where: { stage: "KILLED" } }),
  ]);

  return (
    <CrmShell
      title={stage === "KILLED" ? "Killed Leads" : "Leads"}
      eyebrow={`${leads.length} matching lead${leads.length === 1 ? "" : "s"}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href={stage === "KILLED" ? "/leads" : "/leads?stage=KILLED"} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">
            {stage === "KILLED" ? "← All leads" : `Killed leads (${killedCount})`}
          </Link>
          <Link href="/leads/new" className="rounded-lg bg-[#159a70] px-4 py-2.5 text-sm font-bold text-white">+ Add lead</Link>
        </div>
      }
    >
      <form className="grid gap-3 rounded-xl border border-[#e2e8e5] bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_auto]">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search name, email, phone or property"
          className="h-11 rounded-lg border border-[#dce4e0] px-4 text-sm outline-none focus:border-[#159a70]"
        />
        <select
          name="stage"
          defaultValue={stage ?? ""}
          className="h-11 rounded-lg border border-[#dce4e0] bg-white px-3 text-sm outline-none focus:border-[#159a70]"
        >
          <option value="">All pipeline stages</option>
          {leadStages.map((item) => (
            <option key={item} value={item}>
              {leadStageLabel(item)}
            </option>
          ))}
        </select>
        <button className="h-11 rounded-lg bg-[#173e31] px-5 text-sm font-bold text-white">
          Filter
        </button>
      </form>

      <LeadsTable
        leads={leads.map((lead) => ({
          id: lead.id,
          createdAt: lead.createdAt.toISOString(),
          stage: lead.stage,
          priority: lead.priority,
          contact: {
            firstName: lead.contact.firstName,
            lastName: lead.contact.lastName,
            email: lead.contact.email,
            phone: lead.contact.phone,
          },
          property: lead.property ? { title: lead.property.title } : null,
          website: { name: lead.website.name },
        }))}
      />
    </CrmShell>
  );
}
