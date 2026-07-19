import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([]);
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({
    ...body,
    note: "素材编辑已切换为前端浏览器缓存与后端素材主数据结合模式，不再写入本地 SQLite。"
  });
}
