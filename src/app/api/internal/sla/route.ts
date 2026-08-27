import { timingSafeEqual } from "node:crypto";

import { db } from "@/lib/db";
import { sendSlaEscalationEmail, sendSlaReminderEmail } from "@/lib/email";
import { leadAgeHours, slaCutoffs } from "@/lib/sla-policy";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const expected = process.env.SLA_AUTOMATION_SECRET ?? process.env.AUTH_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !provided) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const cutoffs = slaCutoffs(now);
  const baseUrl = (process.env.CRM_PUBLIC_URL ?? "https://crm.onpointoffices.co.za").replace(/\/$/, "");
  const activeWhere = {
    firstRespondedAt: null,
    closedAt: null,
    stage: { in: ["NEW" as const, "ASSIGNED" as const] },
  };

  const [reminders, overdue] = await Promise.all([
    db.lead.findMany({
      where: {
        ...activeWhere,
        createdAt: { lte: cutoffs.reminder, gt: cutoffs.escalation },
        slaReminderSentAt: null,
        assignedTo: { isNot: null },
      },
      include: { contact: true, assignedTo: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
    db.lead.findMany({
      where: {
        ...activeWhere,
        createdAt: { lte: cutoffs.escalation },
        slaEscalatedAt: null,
      },
      include: { contact: true, assignedTo: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
  ]);

  let remindersSent = 0;
  for (const lead of reminders) {
    if (!lead.assignedTo) continue;
    const contactName = `${lead.contact.firstName} ${lead.contact.lastName ?? ""}`.trim();
    try {
      const result = await sendSlaReminderEmail({
        to: lead.assignedTo.email,
        assigneeName: lead.assignedTo.name,
        contactName,
        leadUrl: `${baseUrl}/leads/${lead.id}`,
      });
      if (result.status !== "sent") continue;
      await db.$transaction([
        db.lead.update({ where: { id: lead.id }, data: { slaReminderSentAt: now } }),
        db.activity.create({ data: { type: "EMAIL", content: "30-minute first-response reminder sent to assignee", leadId: lead.id } }),
      ]);
      remindersSent += 1;
    } catch (error) {
      console.error(`SLA reminder failed for lead ${lead.id}`, error);
    }
  }

  let escalationsSent = 0;
  if (overdue.length) {
    const escalationEmail = (process.env.LEAD_SLA_ESCALATION_EMAIL ?? "luke@blendproperty.co.za").toLowerCase();
    const recipient = await db.user.findFirst({ where: { email: escalationEmail, active: true }, select: { name: true, email: true } });
    const leads = overdue.map((lead) => ({
      id: lead.id,
      contactName: `${lead.contact.firstName} ${lead.contact.lastName ?? ""}`.trim(),
      assigneeName: lead.assignedTo?.name ?? "Unassigned",
      ageHours: leadAgeHours(lead.createdAt, now),
      leadUrl: `${baseUrl}/leads/${lead.id}`,
    }));
    try {
      const result = await sendSlaEscalationEmail({
        to: recipient?.email ?? escalationEmail,
        recipientName: recipient?.name ?? "Luke",
        leads,
      });
      if (result.status === "sent") {
        await db.$transaction(leads.flatMap((lead) => [
          db.lead.update({ where: { id: lead.id }, data: { slaEscalatedAt: now } }),
          db.activity.create({ data: { type: "EMAIL", content: "24-hour first-response assistance notice sent to manager; assignment unchanged", leadId: lead.id } }),
        ]));
        escalationsSent = leads.length;
      }
    } catch (error) {
      console.error("SLA escalation digest failed", error);
    }
  }

  return Response.json({ remindersSent, escalationsSent });
}
