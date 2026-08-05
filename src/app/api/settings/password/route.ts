import { z } from "zod";

import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getCurrentUser } from "@/lib/session";

const schema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(10).max(256) });

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid password" }, { status: 400 });
  const account = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!account?.passwordHash || !(await verifyPassword(parsed.data.currentPassword, account.passwordHash))) {
    return Response.json({ error: "Current password is incorrect" }, { status: 400 });
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } });
  return Response.json({ updated: true });
}
