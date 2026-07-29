import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "blend_crm_session";

export type SessionPayload = {
  userId: string;
  role: "ADMIN" | "MANAGER" | "AGENT";
};

function sessionKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  const key = sessionKey();
  if (!key) throw new Error("AUTH_SECRET must contain at least 32 characters");

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(key);
}

export async function verifySessionToken(token?: string) {
  const key = sessionKey();
  if (!key || !token) return null;

  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    if (
      typeof payload.userId !== "string" ||
      !["ADMIN", "MANAGER", "AGENT"].includes(String(payload.role))
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      role: payload.role as SessionPayload["role"],
    };
  } catch {
    return null;
  }
}
