import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName, verifySessionToken } from "@/lib/auth";

const protectedPaths = ["/"];
const guestOnlyPaths = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const { pathname } = request.nextUrl;

  const isProtected = protectedPaths.some((route) => pathname === route || pathname.startsWith("/api/"));
  const isGuestOnly = guestOnlyPaths.some((route) => pathname === route);

  if (isProtected && !session && !pathname.startsWith("/api/auth/")) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isGuestOnly && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup", "/api/:path*"]
};
