import { z } from "zod";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { getCurrentUser } from "@/lib/session";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  role: z.enum(["ADMIN", "MANAGER", "AGENT"]).optional(),
  active: z.boolean().optional(),
  temporaryPassword: z.string().min(10).max(256).optional(),
});

async function adminUser() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user : null;
}

async function wouldRemoveLastAdmin(id: string, role?: string, active?: boolean) {
  const target = await db.user.findUnique({ where: { id }, select: { role: true, active: true } });
  if (!target || target.role !== "ADMIN" || !target.active) return false;
  if (role === "ADMIN" && active !== false) return false;
  if (role === undefined && active !== false) return false;
  return (await db.user.count({ where: { role: "ADMIN", active: true } })) <= 1;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const currentUser = await adminUser();
  if (!currentUser) return Response.json({ error: "Administrator access required" }, { status: 403 });

  const { id } = await context.params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid user details" }, { status: 400 });
  if (id === currentUser.id && (parsed.data.role || parsed.data.active === false)) {
    return Response.json({ error: "You cannot change your own role or deactivate your own account" }, { status: 400 });
  }
  if (await wouldRemoveLastAdmin(id, parsed.data.role, parsed.data.active)) {
    return Response.json({ error: "At least one active administrator is required" }, { status: 409 });
  }

  const email = parsed.data.email.toLowerCase();
  const duplicate = await db.user.findFirst({ where: { email, id: { not: id } }, select: { id: true } });
  if (duplicate) return Response.json({ error: "A user with this email already exists" }, { status: 409 });

  const user = await db.user.update({
    where: { id },
    data: {
      name: parsed.data.name,
      email,
      role: parsed.data.role,
      active: parsed.data.active,
      ...(parsed.data.temporaryPassword ? { passwordHash: await hashPassword(parsed.data.temporaryPassword) } : {}),
    },
    select: { id: true, name: true, email: true, role: true, active: true },
  }).catch(() => null);

  if (!user) return Response.json({ error: "User not found" }, { status: 404 });
  return Response.json(user);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const currentUser = await adminUser();
  if (!currentUser) return Response.json({ error: "Administrator access required" }, { status: 403 });

  const { id } = await context.params;
  if (id === currentUser.id) return Response.json({ error: "You cannot delete your own account" }, { status: 400 });
  if (await wouldRemoveLastAdmin(id, "AGENT", false)) {
    return Response.json({ error: "At least one active administrator is required" }, { status: 409 });
  }

  const deleted = await db.user.delete({ where: { id }, select: { id: true } }).catch(() => null);
  if (!deleted) return Response.json({ error: "User not found" }, { status: 404 });
  return Response.json({ deleted: true });
}
