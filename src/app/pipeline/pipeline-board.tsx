"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const stages = [
  "NEW",
  "ASSIGNED",
  "CONTACTED",
  "QUALIFIED",
  "VIEWING",
  "NEGOTIATION",
] as const;

type PipelineStage = (typeof stages)[number];

export type PipelineLead = {
  id: string;
  stage: string;
  priority: string;
  contactName: string;
  propertyTitle: string;
  websiteName: string;
};

const label = (value: string) =>
  value.charAt(0) + value.slice(1).toLowerCase();

export function PipelineBoard({
  initialLeads,
}: {
  initialLeads: PipelineLead[];
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<PipelineStage | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const groupedLeads = useMemo(
    () =>
      Object.fromEntries(
        stages.map((stage) => [
          stage,
          leads.filter((lead) => lead.stage === stage),
        ]),
      ) as Record<PipelineStage, PipelineLead[]>,
    [leads],
  );

  async function moveLead(leadId: string, stage: PipelineStage) {
    const existing = leads.find((lead) => lead.id === leadId);
    if (!existing || existing.stage === stage || savingId) return;

    setMessage(null);
    setSavingId(leadId);
    setLeads((current) =>
      current.map((lead) => (lead.id === leadId ? { ...lead, stage } : lead)),
    );

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!response.ok) throw new Error("Stage update failed");
      setMessage(`${existing.contactName} moved to ${label(stage)}.`);
    } catch {
      setLeads((current) =>
        current.map((lead) =>
          lead.id === leadId ? { ...lead, stage: existing.stage } : lead,
        ),
      );
      setMessage("The lead could not be moved. Please try again.");
    } finally {
      setSavingId(null);
      setDraggedId(null);
      setDropStage(null);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#66706c]">
          Drag an opportunity into another stage to update its pipeline status.
        </p>
        <div
          aria-live="polite"
          className="min-h-6 text-sm font-semibold text-[#196e4c]"
        >
          {message}
        </div>
      </div>

      <div className="grid gap-4 overflow-x-auto pb-4 xl:grid-cols-6">
        {stages.map((stage, stageIndex) => {
          const stageLeads = groupedLeads[stage];
          const isTarget = dropStage === stage;

          return (
            <section
              key={stage}
              aria-label={`${label(stage)} pipeline stage`}
              onDragEnter={(event) => {
                event.preventDefault();
                setDropStage(stage);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setDropStage(null);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                const leadId =
                  event.dataTransfer.getData("text/plain") || draggedId;
                if (leadId) void moveLead(leadId, stage);
              }}
              className={`min-h-[510px] min-w-[260px] rounded-[24px] border p-3 transition ${
                isTarget
                  ? "border-[#229d6c] bg-[#e8f7f0] shadow-[0_0_0_3px_rgba(34,157,108,0.12)]"
                  : "border-[#e2e7e4] bg-[#eef2f0]"
              }`}
            >
              <div className="flex items-center justify-between px-2 py-2.5">
                <div>
                  <span className="mb-2 block h-1 w-8 rounded-full bg-[#229d6c]" />
                  <h2 className="text-sm font-extrabold text-[#071839]">
                    {label(stage)}
                  </h2>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-[#071839] shadow-sm">
                  {stageLeads.length}
                </span>
              </div>

              <div className="mt-2 space-y-3">
                {stageLeads.map((lead) => (
                  <article
                    key={lead.id}
                    draggable={savingId !== lead.id}
                    onDragStart={(event) => {
                      setDraggedId(lead.id);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", lead.id);
                    }}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setDropStage(null);
                    }}
                    className={`group rounded-2xl border bg-white p-4 shadow-sm transition ${
                      draggedId === lead.id
                        ? "scale-[0.98] border-[#229d6c] opacity-45"
                        : "border-[#dfe6e2] hover:-translate-y-0.5 hover:shadow-md"
                    } ${savingId === lead.id ? "animate-pulse" : "cursor-grab active:cursor-grabbing"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="min-w-0 flex-1"
                        draggable={false}
                      >
                        <p className="truncate text-sm font-extrabold text-[#071839]">
                          {lead.contactName}
                        </p>
                        <p className="mt-1 truncate text-xs text-[#68756f]">
                          {lead.propertyTitle}
                        </p>
                      </Link>
                      <span
                        aria-hidden="true"
                        className="select-none text-base font-bold tracking-[-0.15em] text-[#9ca8a2] group-hover:text-[#229d6c]"
                      >
                        ⠿
                      </span>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#229d6c]">
                        {lead.websiteName}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7c8882]">
                        {label(lead.priority)}
                      </span>
                    </div>

                    <label className="mt-3 block border-t border-[#edf0ee] pt-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#75817b]">
                      Move stage
                      <select
                        value={lead.stage}
                        disabled={savingId === lead.id}
                        onChange={(event) =>
                          void moveLead(
                            lead.id,
                            event.target.value as PipelineStage,
                          )
                        }
                        className="mt-1.5 w-full rounded-lg border border-[#dce3df] bg-[#f8faf9] px-2 py-1.5 text-xs font-semibold normal-case tracking-normal text-[#071839] outline-none focus:border-[#229d6c] focus:ring-2 focus:ring-[#229d6c]/15"
                      >
                        {stages.map((option) => (
                          <option key={option} value={option}>
                            {label(option)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </article>
                ))}

                {stageLeads.length === 0 && (
                  <div
                    className={`rounded-2xl border border-dashed px-3 py-12 text-center text-xs font-medium transition ${
                      isTarget
                        ? "border-[#229d6c] bg-white/70 text-[#196e4c]"
                        : "border-[#ccd5d0] text-[#7b8982]"
                    }`}
                  >
                    {isTarget ? "Drop opportunity here" : "No opportunities"}
                  </div>
                )}
              </div>

              <p className="mt-5 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9aa59f]">
                Stage {stageIndex + 1} of {stages.length}
              </p>
            </section>
          );
        })}
      </div>
    </div>
  );
}
