"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const stages = ["NEW", "CONTACTED", "QUALIFIED", "VIEWING", "NEGOTIATION", "WON", "LOST"];
const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"];

const label = (value: string) =>
  value.charAt(0) + value.slice(1).toLowerCase();

export function LeadControls({
  leadId,
  stage,
  priority,
  assignedToId,
  users,
}: {
  leadId: string;
  stage: string;
  priority: string;
  assignedToId: string | null;
  users: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function update(values: {
    stage?: string;
    priority?: string;
    assignedToId?: string | null;
  }) {
    setSaving(true);
    setError("");
    const response = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Unable to update the lead");
    } else {
      router.refresh();
    }
    setSaving(false);
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch(`/api/leads/${leadId}/activities`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: data.get("content") }),
    });
    if (response.ok) {
      form.reset();
      router.refresh();
    } else {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Unable to save the note");
    }
    setSaving(false);
  }

  async function deleteLead() {
    const confirmed = window.confirm(
      "Delete this lead? This will also remove its activity log and tasks. This cannot be undone.",
    );
    if (!confirmed) return;
    setDeleting(true);
    setError("");
    const response = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
    if (response.ok) {
      router.push("/leads");
      router.refresh();
    } else {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Unable to delete the lead");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold uppercase tracking-[0.1em] text-[#6e7c76]">
          Stage
          <select
            value={stage}
            disabled={saving}
            onChange={(event) => update({ stage: event.target.value })}
            className="mt-2 h-11 w-full rounded-lg border border-[#dce4e0] bg-white px-3 text-sm font-medium"
          >
            {stages.map((item) => <option key={item} value={item}>{label(item)}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-[0.1em] text-[#6e7c76]">
          Priority
          <select
            value={priority}
            disabled={saving}
            onChange={(event) => update({ priority: event.target.value })}
            className="mt-2 h-11 w-full rounded-lg border border-[#dce4e0] bg-white px-3 text-sm font-medium"
          >
            {priorities.map((item) => <option key={item} value={item}>{label(item)}</option>)}
          </select>
        </label>
      </div>
      <label className="block text-xs font-bold uppercase tracking-[0.1em] text-[#6e7c76]">
        Assigned to
        <select
          value={assignedToId ?? ""}
          disabled={saving}
          onChange={(event) =>
            update({ assignedToId: event.target.value || null })
          }
          className="mt-2 h-11 w-full rounded-lg border border-[#dce4e0] bg-white px-3 text-sm font-medium"
        >
          <option value="">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </label>
      <form onSubmit={addNote}>
        <textarea
          name="content"
          required
          placeholder="Add a note about this lead..."
          className="min-h-28 w-full rounded-lg border border-[#dce4e0] px-4 py-3 text-sm outline-none focus:border-[#159a70]"
        />
        <button disabled={saving} className="mt-2 rounded-lg bg-[#159a70] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {saving ? "Saving..." : "Add note"}
        </button>
      </form>
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="border-t border-[#edf0ef] pt-4">
        <button
          type="button"
          onClick={deleteLead}
          disabled={deleting}
          className="w-full rounded-lg border border-red-200 px-5 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {deleting ? "Deleting..." : "Delete lead"}
        </button>
      </div>
    </div>
  );
}
