import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assetManifestMarkdown } from "@/lib/markdown";

export async function POST(request: Request) {
  const { accountId } = await request.json();
  const account = await prisma.account.findUnique({ where: { id: Number(accountId) } });
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });
  const assets = await prisma.asset.findMany({ where: { accountId: account.id }, orderBy: { createdAt: "desc" } });
  const content = assetManifestMarkdown(account, assets);
  const filePath = path.join(account.assetsPath, "manifest.md");
  await fs.writeFile(filePath, content, "utf8");
  const missingAuth = assets.filter((asset) => asset.authorizationState === "待确认").length;
  return NextResponse.json({
    path: filePath,
    content,
    validation: missingAuth ? `有 ${missingAuth} 个素材授权待确认。` : "manifest 校验通过：素材均已标注授权状态。"
  });
}
