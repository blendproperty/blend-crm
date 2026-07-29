import { z } from "zod";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  status: z.enum(["OPEN", "COMPLETED", "CANCELLED"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid task status" }, { status: 400 });

  const { id } = await context.params;
  const existing = await db.task.findUnique({
    where: { id },
    select: { id: true, title: true, leadId: true },
  });
  if (!existing) return Response.json({ error: "Task not found" }, { status: 404 });

  const task = await db.$transaction(async (transaction) => {
    const updated = await transaction.task.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    await transaction.activity.create({
      data: {
        type: "NOTE",
        content: `Task "${existing.title}" marked ${parsed.data.status.toLowerCase()}`,
        leadId: existing.leadId,
        userId: user.id,
      },
    });
    return updated;
  });

  return Response.json({ id: task.id, status: task.status });
}
