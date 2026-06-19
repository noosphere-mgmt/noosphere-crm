import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminToken } from "@/lib/adminAuth";
import { ADMIN_COOKIE_NAME, decodeAdminCookieValue } from "@/lib/adminCookie";

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!isAdminPath(pathname)) return NextResponse.next();
  if (pathname.startsWith("/admin/login")) return NextResponse.next();
  if (pathname === "/api/admin/login") return NextResponse.next();

  const token = getAdminToken();
  if (!token) {
    return new NextResponse(
      "Admin not configured: set ADMIN_TOKEN in the server environment and restart the process.",
      { status: 503 },
    );
  }

  const cookieVal = decodeAdminCookieValue(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
  if (cookieVal === token) return NextResponse.next();

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
