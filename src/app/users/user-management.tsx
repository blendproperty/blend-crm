"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { generateTemporaryPassword } from "@/lib/temporary-password";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "AGENT";
  active: boolean;
  _count: { assignedLeads: number; tasks: number };
};

export function UserManagement({ users, currentUserId }: { users: ManagedUser[]; currentUserId: string }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function beginEdit(id: string) {
    setEditingId(id);
    setTemporaryPassword("");
    setMessage("");
    setError("");
  }

  async function save(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const isCurrentUser = id === currentUserId;
    const response = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        ...(!isCurrentUser ? { role: form.get("role"), active: form.get("active") === "on" } : {}),
        temporaryPassword: temporaryPassword || undefined,
      }),
    });
    const body = await response.json().catch(() => null);
    if (response.ok) {
      setMessage(temporaryPassword ? "User updated. Copy the temporary password before closing this panel." : "User updated.");
      router.refresh();
    } else {
      setError(body?.error ?? "Unable to update the user");
    }
    setSaving(false);
  }

  async function remove(user: ManagedUser) {
    if (!window.confirm(`Delete ${user.name}? Their lead and task assignments will be cleared.`)) return;
    setSaving(true);
    setError("");
    const response = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => null);
    if (response.ok) {
      setEditingId(null);
      router.refresh();
    } else {
      setError(body?.error ?? "Unable to delete the user");
    }
    setSaving(false);
  }

  const inputClass = "h-10 rounded-lg border border-[#dce4e0] px-3 text-sm outline-none focus:border-[#159a70]";

  return (
    <section className="mt-5 overflow-hidden rounded-xl border border-[#e2e8e5] bg-white shadow-sm">
      {error && <p role="alert" className="m-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="divide-y divide-[#edf0ef]">
        {users.map((user) => (
          <div key={user.id}>
            <div className="grid gap-2 px-6 py-4 md:grid-cols-[1.1fr_1.4fr_0.65fr_0.55fr_0.55fr_auto] md:items-center">
              <div><p className="text-sm font-bold">{user.name}</p>{!user.active && <p className="text-[11px] font-bold uppercase text-red-600">Inactive</p>}</div>
              <p className="text-sm text-[#66746e]">{user.email}</p>
              <span className="w-fit rounded-full bg-[#e4f5ee] px-2.5 py-1 text-[11px] font-bold text-[#137052]">{user.role}</span>
              <p className="text-xs text-[#78857f]">{user._count.assignedLeads} leads</p>
              <p className="text-xs text-[#78857f]">{user._count.tasks} tasks</p>
              <button type="button" onClick={() => editingId === user.id ? setEditingId(null) : beginEdit(user.id)} className="rounded-lg border border-[#dce4e0] px-3 py-2 text-xs font-bold text-[#34443d] hover:border-[#159a70]">{editingId === user.id ? "Close" : "Edit"}</button>
            </div>
            {editingId === user.id && (
              <form onSubmit={(event) => save(event, user.id)} className="border-t border-[#edf0ef] bg-[#f8faf9] p-5">
                <div className="grid gap-3 lg:grid-cols-4">
                  <input className={inputClass} name="name" defaultValue={user.name} required />
                  <input className={inputClass} name="email" type="email" defaultValue={user.email} required />
                  <select className={`${inputClass} bg-white`} name="role" defaultValue={user.role} disabled={user.id === currentUserId}>
                    <option value="AGENT">Agent</option><option value="MANAGER">Manager</option><option value="ADMIN">Administrator</option>
                  </select>
                  <label className="flex h-10 items-center gap-2 text-sm font-semibold"><input type="checkbox" name="active" defaultChecked={user.active} disabled={user.id === currentUserId} /> Active user</label>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input className={`${inputClass} min-w-64 font-mono`} value={temporaryPassword} onChange={(event) => setTemporaryPassword(event.target.value)} minLength={10} placeholder="New temporary password (optional)" />
                  <button type="button" onClick={() => setTemporaryPassword(generateTemporaryPassword())} className="h-10 rounded-lg border border-[#159a70] px-3 text-xs font-bold text-[#137052]">Generate password</button>
                  <button type="button" onClick={() => temporaryPassword && navigator.clipboard.writeText(temporaryPassword)} disabled={!temporaryPassword} className="h-10 rounded-lg border border-[#dce4e0] px-3 text-xs font-bold disabled:opacity-40">Copy</button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button disabled={saving} className="rounded-lg bg-[#159a70] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button>
                  {user.id !== currentUserId && <button type="button" disabled={saving} onClick={() => remove(user)} className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-bold text-red-700 disabled:opacity-60">Delete user</button>}
                  {message && <p role="status" className="text-sm font-medium text-[#137052]">{message}</p>}
                </div>
              </form>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
