import fs from "node:fs/promises";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const id = Number(context.params.id);
  const body = await request.json().catch(() => ({}));

  if (typeof body.profileContent === "string" && body.profilePath) {
    await fs.writeFile(String(body.profilePath), body.profileContent, "utf8").catch(() => null);
  }

  return NextResponse.json({
    id,
    ...body,
    note: "本地 SQLite/Prisma 账号 PATCH 已移除；当前仅保留文件写入与浏览器缓存兼容返回。"
  });
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  const id = Number(context.params.id);
  return NextResponse.json({
    ok: true,
    deletedId: id,
    nextAccountId: null,
    note: "本地 SQLite/Prisma 账号删除已移除；请直接调用后端删除接口。"
  });
}
