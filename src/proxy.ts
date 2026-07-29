import { timingSafeEqual } from "node:crypto";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function proxy(request: NextRequest) {
  const expectedUsername = process.env.CRM_ADMIN_USERNAME;
  const expectedPassword = process.env.CRM_ADMIN_PASSWORD;
  const authorization = request.headers.get("authorization");

  if (expectedUsername && expectedPassword && authorization?.startsWith("Basic ")) {
    try {
      const [username, password] = Buffer.from(
        authorization.slice(6),
        "base64",
      )
        .toString("utf8")
        .split(":", 2);

      if (
        safeEqual(username ?? "", expectedUsername) &&
        safeEqual(password ?? "", expectedPassword)
      ) {
        return NextResponse.next();
      }
    } catch {
      // Invalid Basic authorization header.
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Blend CRM", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

export const config = {
  matcher: [
    "/((?!api/health|api/v1/leads|_next/static|_next/image|favicon.ico).*)",
  ],
};
