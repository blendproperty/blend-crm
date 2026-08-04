"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

function stageLabel(stage: string) {
  return stage.charAt(0) + stage.slice(1).toLowerCase();
}

type LeadRow = {
  id: string;
  stage: string;
  priority: string;
  contact: {
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  };
  property: { title: string } | null;
  website: { name: string };
};

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((current) =>
      current.size === leads.length ? new Set() : new Set(leads.map((lead) => lead.id)),
    );
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    const confirmed = window.confirm(
      `Delete ${selected.size} lead${selected.size === 1 ? "" : "s"}? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    const results = await Promise.all(
      Array.from(selected).map((id) =>
        fetch(`/api/leads/${id}`, { method: "DELETE" }).then((response) => ({
          id,
          ok: response.ok,
        })),
      ),
    );
    const failed = results.filter((result) => !result.ok);
    if (failed.length) {
      setError(`Unable to delete ${failed.length} lead${failed.length === 1 ? "" : "s"}.`);
    }
    setSelected(new Set());
    setDeleting(false);
    router.refresh();
  }

  async function deleteOne(id: string) {
    const confirmed = window.confirm("Delete this lead? This cannot be undone.");
    if (!confirmed) return;
    setDeleting(true);
    setError("");
    const response = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Unable to delete the lead.");
    } else {
      setSelected((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      router.refresh();
    }
    setDeleting(false);
  }

  return (
    <section className="mt-5 overflow-hidden rounded-xl border border-[#e2e8e5] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0ef] bg-[#f8faf9] px-6 py-3">
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-[#6e7c76]">
          <input
            type="checkbox"
            checked={leads.length > 0 && selected.size === leads.length}
            onChange={toggleAll}
            disabled={leads.length === 0 || deleting}
            className="h-4 w-4 rounded border-[#c9d4cf]"
          />
          Select all
        </label>
        <div className="flex items-center gap-3">
          {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
          <button
            type="button"
            onClick={deleteSelected}
            disabled={selected.size === 0 || deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? "Deleting..." : `Delete selected${selected.size ? ` (${selected.size})` : ""}`}
          </button>
        </div>
      </div>

      <div className="hidden grid-cols-[auto_1.4fr_1fr_1fr_0.8fr_0.7fr_auto] gap-4 border-b border-[#edf0ef] bg-[#f8faf9] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#78857f] md:grid">
        <span />
        <span>Contact</span>
        <span>Property</span>
        <span>Source</span>
        <span>Stage</span>
        <span>Priority</span>
        <span />
      </div>
      <div className="divide-y divide-[#edf0ef]">
        {leads.map((lead) => (
          <div
            key={lead.id}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-6 py-4 transition hover:bg-[#f8faf9] md:grid-cols-[auto_1.4fr_1fr_1fr_0.8fr_0.7fr_auto] md:gap-4"
          >
            <input
              type="checkbox"
              checked={selected.has(lead.id)}
              onChange={() => toggle(lead.id)}
              disabled={deleting}
              className="h-4 w-4 rounded border-[#c9d4cf]"
            />
            <Link href={`/leads/${lead.id}`} className="contents">
              <div>
                <p className="text-sm font-bold">
                  {lead.contact.firstName} {lead.contact.lastName}
                </p>
                <p className="text-xs text-[#7a8781]">
                  {lead.contact.email ?? lead.contact.phone ?? "No contact details"}
                </p>
              </div>
              <p className="hidden text-sm text-[#52615a] md:block">
                {lead.property?.title ?? "General enquiry"}
              </p>
              <p className="hidden text-sm text-[#52615a] md:block">{lead.website.name}</p>
              <span className="hidden w-fit rounded-full bg-[#e4f5ee] px-2.5 py-1 text-[11px] font-bold text-[#137052] md:inline-block">
                {stageLabel(lead.stage)}
              </span>
              <span className="hidden text-xs font-bold text-[#66746e] md:block">
                {stageLabel(lead.priority)}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => deleteOne(lead.id)}
              disabled={deleting}
              className="justify-self-end rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-40"
            >
              Delete
            </button>
          </div>
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
  );
}
