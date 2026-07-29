import { NewUserForm } from "@/app/users/new-user-form";
import { CrmShell } from "@/components/crm-shell";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function UsersPage() {
  const currentUser = await requireUser();
  const users = await db.user.findMany({
    include: { _count: { select: { assignedLeads: true, tasks: true } } },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <CrmShell title="Team" eyebrow={`${users.length} CRM users`}>
      {currentUser.role === "ADMIN" && <NewUserForm />}
      <section className="mt-5 overflow-hidden rounded-xl border border-[#e2e8e5] bg-white shadow-sm">
        <div className="divide-y divide-[#edf0ef]">
          {users.map((user) => (
            <div key={user.id} className="grid gap-2 px-6 py-4 md:grid-cols-[1.2fr_1.4fr_0.7fr_0.7fr_0.7fr] md:items-center">
              <p className="text-sm font-bold">{user.name}</p>
              <p className="text-sm text-[#66746e]">{user.email}</p>
              <span className="w-fit rounded-full bg-[#e4f5ee] px-2.5 py-1 text-[11px] font-bold text-[#137052]">{user.role}</span>
              <p className="text-xs text-[#78857f]">{user._count.assignedLeads} leads</p>
              <p className="text-xs text-[#78857f]">{user._count.tasks} tasks</p>
            </div>
          ))}
        </div>
      </section>
    </CrmShell>
  );
}
