import { NextResponse } from "next/server";
import { listCrmUsers } from "@/lib/repos/crmUsers";

export const dynamic = "force-dynamic";
export async function GET() {
  const users = (await listCrmUsers()).filter((user) => user.is_active);
  return NextResponse.json(users.map(({ id, display_name, user_type, role }) => ({ id, display_name, user_type, role })));
}
