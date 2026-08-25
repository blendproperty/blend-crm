import { z } from "zod";

import { db } from "@/lib/db";
import { sendAssignmentEmail } from "@/lib/email";
import { leadStages, leadStageLabel } from "@/lib/lead-stage";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  stage: z.enum(leadStages).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  assignedToId: z.string().min(1).nullable().optional(),
  killReason: z.string().trim().min(2).max(500).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (
    !parsed.success ||
    (!parsed.data.stage &&
      !parsed.data.priority &&
      parsed.data.assignedToId === undefined)
  ) {
    return Response.json({ error: "Invalid update" }, { status: 400 });
  }

  const { id } = await context.params;
  const existing = await db.lead.findUnique({
    where: { id },
    select: {
      id: true,
      stage: true,
      priority: true,
      firstRespondedAt: true,
      assignedToId: true,
      assignedTo: { select: { name: true } },
    },
  });
  if (!existing) return Response.json({ error: "Lead not found" }, { status: 404 });

  const changes: string[] = [];
  let newAssignee: { name: string; email: string } | null = null;
  if (parsed.data.stage && parsed.data.stage !== existing.stage) {
    changes.push(`Stage changed from ${leadStageLabel(existing.stage)} to ${leadStageLabel(parsed.data.stage)}`);
    if (parsed.data.stage === "KILLED") {
      changes.push(`Killed reason: ${parsed.data.killReason ?? "Manually killed"}`);
    }
  }
  if (parsed.data.priority && parsed.data.priority !== existing.priority) {
    changes.push(`Priority changed from ${existing.priority} to ${parsed.data.priority}`);
  }
  if (
    parsed.data.assignedToId !== undefined &&
    parsed.data.assignedToId !== existing.assignedToId
  ) {
    const assignee = parsed.data.assignedToId
      ? await db.user.findFirst({
          where: { id: parsed.data.assignedToId, active: true },
          select: { name: true, email: true },
        })
      : null;
    if (parsed.data.assignedToId && !assignee) {
      return Response.json({ error: "Selected team member was not found" }, { status: 400 });
    }
    changes.push(
      assignee
        ? `Lead assigned to ${assignee.name}`
        : `Lead unassigned from ${existing.assignedTo?.name ?? "team member"}`,
    );
    newAssignee = assignee;
  }

  const now = new Date();
  const lead = await db.$transaction(async (transaction) => {
    const updated = await transaction.lead.update({
      where: { id },
      data: {
        stage: parsed.data.stage,
        priority: parsed.data.priority,
        assignedToId: parsed.data.assignedToId,
        ...(parsed.data.stage &&
        parsed.data.stage !== "NEW" &&
        !existing.firstRespondedAt
          ? { firstRespondedAt: now }
          : {}),
        ...(parsed.data.stage === "WON" || parsed.data.stage === "LOST" || parsed.data.stage === "KILLED"
          ? { closedAt: now }
          : parsed.data.stage
            ? { closedAt: null }
            : {}),
        ...(parsed.data.stage === "KILLED"
          ? {
              killedReason: parsed.data.killReason ?? "Manually killed",
              killedAt: now,
              killedAutomatically: false,
            }
          : parsed.data.stage
            ? { killedReason: null, killedAt: null, killedAutomatically: false }
            : {}),
      },
    });

    if (changes.length) {
      await transaction.activity.create({
        data: {
          type:
            parsed.data.assignedToId !== undefined
              ? "ASSIGNMENT"
              : "STATUS_CHANGE",
          content: changes.join(". "),
          leadId: id,
          userId: user.id,
        },
      });
    }
    return updated;
  });

  let assignmentEmail: "not_applicable" | "sent" | "not_configured" | "failed" = "not_applicable";
  if (newAssignee) {
    try {
      const emailLead = await db.lead.findUnique({
        where: { id },
        select: {
          id: true,
          priority: true,
          message: true,
          contact: { select: { firstName: true, lastName: true, email: true, phone: true, company: true } },
          property: { select: { title: true, reference: true } },
        },
      });
      if (emailLead) {
        const baseUrl = process.env.CRM_PUBLIC_URL?.replace(/\/$/, "") ?? "https://crm.onpointoffices.co.za";
        const result = await sendAssignmentEmail({
          to: newAssignee.email,
          assigneeName: newAssignee.name,
          assignedByName: user.name,
          contactName: `${emailLead.contact.firstName} ${emailLead.contact.lastName ?? ""}`.trim(),
          contactEmail: emailLead.contact.email,
          contactPhone: emailLead.contact.phone,
          company: emailLead.contact.company,
          propertyName: emailLead.property ? `${emailLead.property.title} (${emailLead.property.reference})` : "General enquiry",
          priority: emailLead.priority,
          message: emailLead.message,
          leadUrl: `${baseUrl}/leads/${emailLead.id}`,
        });
        assignmentEmail = result.status;
        await db.activity.create({
          data: {
            type: "ASSIGNMENT",
            content: result.status === "sent"
              ? `Assignment email sent to ${newAssignee.name}`
              : "Assignment email not sent because SMTP is not configured",
            leadId: id,
            userId: user.id,
          },
        });
      }
    } catch (error) {
      assignmentEmail = "failed";
      console.error("Assignment email delivery failed", error);
      await db.activity.create({
        data: { type: "ASSIGNMENT", content: `Assignment email to ${newAssignee.name} failed`, leadId: id, userId: user.id },
      }).catch(() => undefined);
    }
  }

  return Response.json({
    id: lead.id,
    stage: lead.stage,
    priority: lead.priority,
    assignedToId: lead.assignedToId,
    assignmentEmail,
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const existing = await db.lead.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return Response.json({ error: "Lead not found" }, { status: 404 });

  // Activities and tasks cascade-delete with the lead (see prisma/schema.prisma).
  await db.lead.delete({ where: { id } });

  return Response.json({ ok: true });
}
