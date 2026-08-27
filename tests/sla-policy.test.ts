import assert from "node:assert/strict";
import test from "node:test";

import { buildSlaEscalationEmail, buildSlaReminderEmail } from "../src/lib/email";
import { leadAgeHours, slaCutoffs } from "../src/lib/sla-policy";

test("SLA cutoffs are 30 minutes and 24 hours", () => {
  const now = new Date("2026-08-27T10:00:00.000Z");
  const cutoffs = slaCutoffs(now);
  assert.equal(cutoffs.reminder.toISOString(), "2026-08-27T09:30:00.000Z");
  assert.equal(cutoffs.escalation.toISOString(), "2026-08-26T10:00:00.000Z");
  assert.equal(leadAgeHours(new Date("2026-08-26T08:00:00.000Z"), now), 26);
});

test("reminder wording is neutral and action focused", () => {
  const email = buildSlaReminderEmail({ assigneeName: "Boitumelo", contactName: "Prospect", leadUrl: "https://crm.example/leads/1" });
  assert.match(email.text, /quick reminder/i);
  assert.match(email.text, /update the stage or add a note/i);
});

test("escalation wording requests assistance without reassigning or blaming", () => {
  const email = buildSlaEscalationEmail({
    recipientName: "Luke",
    leads: [{ contactName: "Prospect", assigneeName: "Boitumelo", ageHours: 25, leadUrl: "https://crm.example/leads/1" }],
  });
  assert.match(email.text, /operational visibility/i);
  assert.match(email.text, /ownership has not been changed/i);
  assert.doesNotMatch(email.text, /failed|ignored|negligent/i);
});
