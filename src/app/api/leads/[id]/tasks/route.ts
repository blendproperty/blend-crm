import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { taskInputSchema } from "@/lib/task-input";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = taskInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid task" },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const lead = await db.lead.findUnique({ where: { id }, select: { id: true } });
  if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });

  const assigneeId = parsed.data.assigneeId ?? user.id;
  const assignee = await db.user.findFirst({
    where: { id: assigneeId, active: true },
    select: { id: true },
  });
  if (!assignee) {
    return Response.json({ error: "Selected team member was not found" }, { status: 400 });
  }

  const task = await db.$transaction(async (transaction) => {
    const created = await transaction.task.create({
      data: {
        type: parsed.data.type,
        title: parsed.data.title,
        description: parsed.data.description || undefined,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
        leadId: id,
        assigneeId,
      },
    });
    await transaction.activity.create({
      data: {
        type: "NOTE",
        content: `${created.type === "CALLBACK" ? "Call-back follow-up" : "Task"} created: ${created.title}${created.dueAt ? ` for ${created.dueAt.toISOString()}` : ""}`,
        leadId: id,
        userId: user.id,
      },
    });
    return created;
  });

  return Response.json({ id: task.id }, { status: 201 });
}
