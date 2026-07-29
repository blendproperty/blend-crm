import Link from "next/link";

import { CrmShell } from "@/components/crm-shell";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

const stages = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "VIEWING",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

function stageLabel(stage: string) {
  return stage.charAt(0) + stage.slice(1).toLowerCase();
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string }>;
}) {
  await requireUser();
  const filters = await searchParams;
  const query = filters.q?.trim() ?? "";
  const stage = stages.includes(filters.stage as (typeof stages)[number])
    ? (filters.stage as (typeof stages)[number])
    : undefined;

  const leads = await db.lead.findMany({
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
    include: {
      contact: true,
      website: true,
      property: true,
      assignedTo: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <CrmShell
      title="Leads"
      eyebrow={`${leads.length} matching lead${leads.length === 1 ? "" : "s"}`}
      actions={
        <Link
          href="/leads/new"
          className="rounded-lg bg-[#159a70] px-4 py-2.5 text-sm font-bold text-white"
        >
          + Add lead
        </Link>
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
          {stages.map((item) => (
            <option key={item} value={item}>
              {stageLabel(item)}
            </option>
          ))}
        </select>
        <button className="h-11 rounded-lg bg-[#173e31] px-5 text-sm font-bold text-white">
          Filter
        </button>
      </form>

      <section className="mt-5 overflow-hidden rounded-xl border border-[#e2e8e5] bg-white shadow-sm">
        <div className="hidden grid-cols-[1.4fr_1fr_1fr_0.8fr_0.7fr] gap-4 border-b border-[#edf0ef] bg-[#f8faf9] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#78857f] md:grid">
          <span>Contact</span>
          <span>Property</span>
          <span>Source</span>
          <span>Stage</span>
          <span>Priority</span>
        </div>
        <div className="divide-y divide-[#edf0ef]">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="grid gap-2 px-6 py-4 transition hover:bg-[#f8faf9] md:grid-cols-[1.4fr_1fr_1fr_0.8fr_0.7fr] md:items-center md:gap-4"
            >
              <div>
                <p className="text-sm font-bold">
                  {lead.contact.firstName} {lead.contact.lastName}
                </p>
                <p className="text-xs text-[#7a8781]">
                  {lead.contact.email ?? lead.contact.phone ?? "No contact details"}
                </p>
              </div>
              <p className="text-sm text-[#52615a]">
                {lead.property?.title ?? "General enquiry"}
              </p>
              <p className="text-sm text-[#52615a]">{lead.website.name}</p>
              <span className="w-fit rounded-full bg-[#e4f5ee] px-2.5 py-1 text-[11px] font-bold text-[#137052]">
                {stageLabel(lead.stage)}
              </span>
              <span className="text-xs font-bold text-[#66746e]">
                {stageLabel(lead.priority)}
              </span>
            </Link>
          ))}
          {leads.length === 0 && (
            <div className="px-6 py-16 text-center">
              <p className="font-bold">No leads found</p>
              <p className="mt-1 text-sm text-[#74817b]">
                Adjust the filters or add the first lead manually.
              </p>
            </div>
          )}
        </div>
      </section>
    </CrmShell>
  );
}
