import { NewUserForm } from "@/app/users/new-user-form";
import { UserManagement } from "@/app/users/user-management";
import { CrmShell } from "@/components/crm-shell";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export default async function UsersPage() {
  const currentUser = await requireAdmin();
  const users = await db.user.findMany({
    include: { _count: { select: { assignedLeads: true, tasks: true } } },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <CrmShell title="Team" eyebrow={`${users.length} CRM users`}>
      <NewUserForm />
      <UserManagement users={users} currentUserId={currentUser.id} />
    </CrmShell>
  );
}
