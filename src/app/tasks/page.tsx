import Link from "next/link";

import { CrmShell } from "@/components/crm-shell";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function TasksPage() {
  await requireUser();
  const tasks = await db.task.findMany({
    include: { lead: { include: { contact: true } }, assignee: true },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
  });

  return (
    <CrmShell title="Tasks" eyebrow={`${tasks.filter((task) => task.status === "OPEN").length} open tasks`}>
      <section className="overflow-hidden rounded-xl border border-[#e2e8e5] bg-white shadow-sm">
        <div className="divide-y divide-[#edf0ef]">
          {tasks.map((task) => (
            <Link key={task.id} href={`/leads/${task.leadId}`} className="grid gap-2 px-6 py-4 hover:bg-[#f8faf9] md:grid-cols-[1fr_1fr_180px_120px] md:items-center">
              <p className="text-sm font-bold">{task.title}</p>
              <p className="text-sm text-[#63716b]">{task.lead.contact.firstName} {task.lead.contact.lastName}</p>
              <p className="text-xs text-[#7c8883]">{task.assignee?.name ?? "Unassigned"}</p>
              <span className="w-fit rounded-full bg-[#e4f5ee] px-2.5 py-1 text-[11px] font-bold text-[#137052]">{task.status}</span>
            </Link>
          ))}
          {tasks.length === 0 && <p className="px-6 py-16 text-center text-sm text-[#74817b]">No tasks have been created yet.</p>}
        </div>
      </section>
    </CrmShell>
  );
}
