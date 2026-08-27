export const SLA_REMINDER_MINUTES = 30;
export const SLA_ESCALATION_HOURS = 24;

export function slaCutoffs(now: Date) {
  return {
    reminder: new Date(now.getTime() - SLA_REMINDER_MINUTES * 60_000),
    escalation: new Date(now.getTime() - SLA_ESCALATION_HOURS * 60 * 60_000),
  };
}

export function leadAgeHours(createdAt: Date, now: Date) {
  return Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 3_600_000));
}
