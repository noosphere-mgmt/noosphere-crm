import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.NOOSPHERE_DATABASE_URL?.trim());
  let dbOk = false;
  let dbError: string | null = null;

  if (hasDatabaseUrl) {
    try {
      await query("SELECT 1 AS ok");
      dbOk = true;
    } catch (e) {
      dbError = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json({
    ok: hasDatabaseUrl && dbOk,
    service: "noosphere-realestate",
    hasDatabaseUrl,
    dbOk,
    dbError,
  });
}
