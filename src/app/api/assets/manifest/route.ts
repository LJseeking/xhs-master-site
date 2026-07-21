import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { assetManifestMarkdown } from "@/lib/markdown";

export async function POST(request: Request) {
  const { account, assets } = await request.json();
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });
  const content = assetManifestMarkdown(account, assets);
  const filePath = path.join(account.assetsPath, "manifest.md");
  await fs.writeFile(filePath, content, "utf8");
  return NextResponse.json({
    path: filePath,
    content,
    validation: "素材清单生成完成。"
  });
}
