import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    synced: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    note: "本地 SQLite/Prisma 同步已移除；账号主数据现在直接使用后端接口与浏览器缓存。"
  });
}
