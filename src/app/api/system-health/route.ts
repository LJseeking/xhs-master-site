import { NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getSystemHealth());
}
