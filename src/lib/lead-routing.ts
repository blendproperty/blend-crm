import type { LeadIntake } from "@/lib/lead-intake";

export function isBedfordviewLead(input: LeadIntake) {
  const searchable = [
    input.property?.title,
    input.property?.address,
    input.property?.reference,
    input.message,
    input.sourcePage,
  ].filter(Boolean).join("\n");
  return /\bbedfordview\b/i.test(searchable);
}

export function leadAssigneeEmail(input: LeadIntake, autoKillReason: string | null) {
  if (autoKillReason) return null;
  if (isBedfordviewLead(input)) {
    return (process.env.LEAD_BEDFORDVIEW_ASSIGNEE_EMAIL ?? "brad@blendproperty.co.za").trim().toLowerCase();
  }
  return (process.env.LEAD_DEFAULT_ASSIGNEE_EMAIL ?? "boitumelo@blendproperty.co.za").trim().toLowerCase();
}
