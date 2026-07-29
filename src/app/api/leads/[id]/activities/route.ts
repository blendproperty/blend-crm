import { z } from "zod";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({
  content: z.string().trim().min(1).max(5000),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "A note is required" }, { status: 400 });
  }

  const { id } = await context.params;
  const lead = await db.lead.findUnique({ where: { id }, select: { id: true } });
  if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });

  const activity = await db.activity.create({
    data: {
      type: "NOTE",
      content: parsed.data.content,
      leadId: id,
      userId: user.id,
    },
  });

  return Response.json({ id: activity.id }, { status: 201 });
}
