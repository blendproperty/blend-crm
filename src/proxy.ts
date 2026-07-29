import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

export async function proxy(request: NextRequest) {
  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (isLoginPage && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isLoginPage && !session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login"],
};
