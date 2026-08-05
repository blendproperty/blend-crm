import { z } from "zod";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({ name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(320) });

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid profile" }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  const duplicate = await db.user.findFirst({ where: { email, id: { not: user.id } }, select: { id: true } });
  if (duplicate) return Response.json({ error: "A user with this email already exists" }, { status: 409 });
  const updated = await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name, email }, select: { name: true, email: true } });
  return Response.json(updated);
}
