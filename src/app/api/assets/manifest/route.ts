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
  const missingAuth = (Array.isArray(assets) ? assets : []).filter(
    (asset: { authorizationState?: string }) => asset.authorizationState === "待确认"
  ).length;
  return NextResponse.json({
    path: filePath,
    content,
    validation: missingAuth ? `有 ${missingAuth} 个素材授权待确认。` : "manifest 校验通过：素材均已标注授权状态。"
  });
}
