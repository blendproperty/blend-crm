import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password || password.length > 256) {
    return Response.json({ error: "Email and password are required" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
      active: true,
      passwordHash: true,
    },
  });

  const valid =
    user?.active &&
    user.passwordHash &&
    (await verifyPassword(password, user.passwordHash));

  if (!valid || !user) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return Response.json({ error: "Incorrect email or password" }, { status: 401 });
  }

  await createSession(user.id, user.role);
  return Response.json({ success: true });
}
