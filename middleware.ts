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

  if (isGuestOnly) {
    if (session) {
      // User has valid session, redirect to dashboard
      return NextResponse.redirect(new URL("/", request.url));
    } else if (token) {
      // Token exists but is invalid/malformed - actively clear it
      const response = NextResponse.next();
      response.cookies.set(sessionCookieName, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/"
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup", "/api/:path*"]
};
