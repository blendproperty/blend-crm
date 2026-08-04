import { z } from "zod";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  stage: z
    .enum(["NEW", "CONTACTED", "QUALIFIED", "VIEWING", "NEGOTIATION", "WON", "LOST"])
    .optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  assignedToId: z.string().min(1).nullable().optional(),
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
  if (parsed.data.stage && parsed.data.stage !== existing.stage) {
    changes.push(`Stage changed from ${existing.stage} to ${parsed.data.stage}`);
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
          select: { name: true },
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
  }

  const now = new Date();
  const lead = await db.$transaction(async (transaction) => {
    const updated = await transaction.lead.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(parsed.data.stage &&
        parsed.data.stage !== "NEW" &&
        !existing.firstRespondedAt
          ? { firstRespondedAt: now }
          : {}),
        ...(parsed.data.stage === "WON" || parsed.data.stage === "LOST"
          ? { closedAt: now }
          : parsed.data.stage
            ? { closedAt: null }
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

  return Response.json({
    id: lead.id,
    stage: lead.stage,
    priority: lead.priority,
    assignedToId: lead.assignedToId,
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
