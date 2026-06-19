import { NextRequest, NextResponse } from "next/server";
import { getAdminToken } from "@/lib/adminAuth";
import { ADMIN_COOKIE_NAME, encodeAdminCookieValue } from "@/lib/adminCookie";

export const runtime = "nodejs";

const SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(req: NextRequest) {
  const token = getAdminToken();
  if (!token) {
    return NextResponse.json(
      { error: "ADMIN_TOKEN not configured on the server." },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    token?: string;
    next?: string;
    remember?: boolean;
  } | null;
  const provided = (body?.token ?? "").trim();
  const nextPath = body?.next?.startsWith("/") ? body.next : "/admin";
  const remember = Boolean(body?.remember);

  if (!provided || provided !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, redirectTo: nextPath });
  res.cookies.set(ADMIN_COOKIE_NAME, encodeAdminCookieValue(token), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: remember ? REMEMBER_MAX_AGE : SESSION_MAX_AGE,
  });
  return res;
}
