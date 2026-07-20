import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    synced: 0,
    created: 0,
    updated: 0,
    skipped: 0
  });
}
