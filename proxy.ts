import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, TOKEN_COOKIE } from "@/lib/auth";

// Pages that don't require authentication
const publicPaths = ["/login", "/signup", "/admin", "/", "/unauthorized", "/orders"];

function isPublicPath(pathname: string) {
  if (publicPaths.includes(pathname)) return true;
  // Ebook detail pages are publicly viewable (preview requires auth but page loads)
  if (pathname.startsWith("/ebook/")) return true;
  return false;
}

function decodeJwtRole(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = atob(padded);
    const payload = JSON.parse(json) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

function isValidJwt(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return false;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = atob(padded);
    const payload = JSON.parse(json) as { exp?: number };

    if (!payload.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets, API, Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const authCookie = request.cookies.get(AUTH_COOKIE)?.value;
  const hasValidToken = Boolean(token && isValidJwt(token));
  const isAuthenticated = hasValidToken || (authCookie === "1" && hasValidToken);
  const isPublic = isPublicPath(pathname);

  if (pathname.startsWith("/admin/") || pathname === "/admin/dashboard") {
    if (!token || !hasValidToken) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    const tokenRole = decodeJwtRole(token);
    if (tokenRole !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Unauthenticated user trying to access protected page
  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/admin" && token) {
    if (!hasValidToken) {
      return NextResponse.next();
    }

    const tokenRole = decodeJwtRole(token);
    if (tokenRole === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
