export const leadStages = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "VIEWING",
  "NEGOTIATION",
  "WON",
  "LOST",
  "KILLED",
] as const;

export type LeadStageValue = (typeof leadStages)[number];

export function leadStageLabel(stage: string) {
  return stage.charAt(0) + stage.slice(1).toLowerCase();
}

export function leadStageBadgeClass(stage: string) {
  const classes: Record<string, string> = {
    NEW: "border-sky-200 bg-sky-50 text-sky-700",
    CONTACTED: "border-blue-200 bg-blue-50 text-blue-700",
    QUALIFIED: "border-violet-200 bg-violet-50 text-violet-700",
    VIEWING: "border-amber-200 bg-amber-50 text-amber-800",
    NEGOTIATION: "border-orange-200 bg-orange-50 text-orange-700",
    WON: "border-emerald-200 bg-emerald-50 text-emerald-700",
    LOST: "border-red-200 bg-red-50 text-red-700",
    KILLED: "border-slate-300 bg-slate-100 text-slate-700",
  };
  return classes[stage] ?? "border-slate-200 bg-slate-50 text-slate-700";
}
