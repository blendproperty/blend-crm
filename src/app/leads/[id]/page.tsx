import Link from "next/link";
import { notFound } from "next/navigation";

import { LeadControls } from "@/app/leads/[id]/lead-controls";
import { TaskControls } from "@/app/leads/[id]/task-controls";
import { CrmShell } from "@/components/crm-shell";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(date);
}

export default async function LeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const [lead, users] = await Promise.all([
    db.lead.findUnique({
      where: { id },
      include: {
        contact: true,
        website: true,
        property: true,
        assignedTo: true,
        activities: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
        tasks: { orderBy: { createdAt: "desc" } },
      },
    }),
    db.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!lead) notFound();

  const contactName =
    `${lead.contact.firstName} ${lead.contact.lastName ?? ""}`.trim();

  return (
    <CrmShell
      title={contactName}
      eyebrow={`${lead.website.name} · ${formatDate(lead.createdAt)}`}
      actions={<Link href="/leads" className="text-sm font-bold text-[#168f69]">← Back to leads</Link>}
    >
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-[#e2e8e5] bg-white p-6 shadow-sm">
            <h2 className="font-bold">Lead details</h2>
            <div className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
              <div><p className="text-xs font-bold uppercase text-[#87938e]">Email</p><p className="mt-1">{lead.contact.email ?? "—"}</p></div>
              <div><p className="text-xs font-bold uppercase text-[#87938e]">Phone</p><p className="mt-1">{lead.contact.phone ?? "—"}</p></div>
              <div><p className="text-xs font-bold uppercase text-[#87938e]">Company</p><p className="mt-1">{lead.contact.company ?? "—"}</p></div>
              <div><p className="text-xs font-bold uppercase text-[#87938e]">Assigned to</p><p className="mt-1">{lead.assignedTo?.name ?? "Unassigned"}</p></div>
              <div className="sm:col-span-2"><p className="text-xs font-bold uppercase text-[#87938e]">Property</p><p className="mt-1">{lead.property ? `${lead.property.title} (${lead.property.reference})` : "General enquiry"}</p></div>
              {lead.stage === "KILLED" && (
                <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Killed lead</p>
                  <p className="mt-1 font-semibold text-slate-800">{lead.killedReason ?? "No reason recorded"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {lead.killedAutomatically ? "Auto-killed" : "Killed manually"}
                    {lead.killedAt ? ` · ${formatDate(lead.killedAt)}` : ""}
                  </p>
                </div>
              )}
              <div className="sm:col-span-2"><p className="text-xs font-bold uppercase text-[#87938e]">Original message</p><p className="mt-2 whitespace-pre-wrap leading-6 text-[#52615a]">{lead.message ?? "No message supplied."}</p></div>
            </div>
          </section>

          <section className="rounded-xl border border-[#e2e8e5] bg-white p-6 shadow-sm">
            <h2 className="font-bold">Activity</h2>
            <div className="mt-5 space-y-4">
              {lead.activities.map((activity) => (
                <div key={activity.id} className="border-l-2 border-[#cfe7de] pl-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[#168f69]">{activity.type.replace("_", " ")}</span>
                    <span className="text-[11px] text-[#87938e]">{formatDate(activity.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm leading-6">{activity.content}</p>
                  {activity.user && <p className="mt-1 text-xs text-[#87938e]">by {activity.user.name}</p>}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-[#e2e8e5] bg-white p-6 shadow-sm">
            <h2 className="font-bold">Manage lead</h2>
            <div className="mt-5">
              <LeadControls
                leadId={lead.id}
                stage={lead.stage}
                priority={lead.priority}
                assignedToId={lead.assignedToId}
                users={users}
              />
            </div>
          </section>
          <section className="rounded-xl border border-[#e2e8e5] bg-white p-6 shadow-sm">
            <h2 className="font-bold">Tasks</h2>
            <div className="mt-4">
              <TaskControls
                leadId={lead.id}
                users={users}
                tasks={lead.tasks.map((task) => ({
                  id: task.id,
                  title: task.title,
                  status: task.status,
                  dueAt: task.dueAt?.toISOString() ?? null,
                }))}
              />
            </div>
          </section>
        </aside>
      </div>
    </CrmShell>
  );
}
