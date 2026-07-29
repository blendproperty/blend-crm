import { CrmShell } from "@/components/crm-shell";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function ReportsPage() {
  await requireUser();
  const [total, won, lost, sources, stages] = await Promise.all([
    db.lead.count(),
    db.lead.count({ where: { stage: "WON" } }),
    db.lead.count({ where: { stage: "LOST" } }),
    db.website.findMany({ include: { _count: { select: { leads: true } } } }),
    db.lead.groupBy({ by: ["stage"], _count: { _all: true } }),
  ]);

  return (
    <CrmShell title="Reports" eyebrow="CRM performance">
      <section className="grid gap-4 sm:grid-cols-3">
        {[["Total leads", total], ["Won", won], ["Lost", lost]].map(([label, value]) => (
          <article key={label} className="rounded-xl border border-[#e2e8e5] bg-white p-6 shadow-sm">
            <p className="text-sm text-[#6f7d77]">{label}</p>
            <p className="mt-3 text-3xl font-bold">{value}</p>
          </article>
        ))}
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-[#e2e8e5] bg-white p-6 shadow-sm">
          <h2 className="font-bold">By source</h2>
          <div className="mt-5 space-y-3">
            {sources.map((source) => <div key={source.id} className="flex justify-between border-b border-[#edf0ef] pb-3 text-sm"><span>{source.name}</span><b>{source._count.leads}</b></div>)}
          </div>
        </article>
        <article className="rounded-xl border border-[#e2e8e5] bg-white p-6 shadow-sm">
          <h2 className="font-bold">By stage</h2>
          <div className="mt-5 space-y-3">
            {stages.map((stage) => <div key={stage.stage} className="flex justify-between border-b border-[#edf0ef] pb-3 text-sm"><span>{stage.stage.charAt(0) + stage.stage.slice(1).toLowerCase()}</span><b>{stage._count._all}</b></div>)}
          </div>
        </article>
      </section>
    </CrmShell>
  );
}
