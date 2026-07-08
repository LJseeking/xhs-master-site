import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".avif"]);
const videoExtensions = new Set([".mp4", ".mov", ".m4v", ".webm"]);

function fileTypeFor(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (imageExtensions.has(ext)) return `image/${ext.replace(".", "").replace("jpg", "jpeg")}`;
  if (videoExtensions.has(ext)) return `video/${ext.replace(".", "").replace("mov", "quicktime")}`;
  return "";
}

async function walkMediaFiles(dir: string, maxFiles = 300) {
  const files: string[] = [];
  async function walk(current: string) {
    if (files.length >= maxFiles) return;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (files.length >= maxFiles) break;
      if (entry.name.startsWith(".")) continue;
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (entry.isFile() && fileTypeFor(fullPath)) files.push(fullPath);
    }
  }
  await walk(dir);
  return files;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const accountId = Number(body.accountId);
  const folderPath = String(body.folderPath || "").trim();
  if (!accountId || !folderPath) {
    return NextResponse.json({ error: "缺少 accountId 或 folderPath" }, { status: 400 });
  }

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });

  const absoluteFolderPath = path.resolve(folderPath.replace(/^~/, process.env.HOME || "~"));
  const stat = await fs.stat(absoluteFolderPath).catch(() => null);
  if (!stat?.isDirectory()) {
    return NextResponse.json({ error: "文件夹不存在，或当前电脑无法访问这个路径。" }, { status: 400 });
  }

  const mediaFiles = await walkMediaFiles(absoluteFolderPath);
  const existing = await prisma.asset.findMany({
    where: { accountId, filePath: { in: mediaFiles } },
    select: { filePath: true }
  });
  const existingPaths = new Set(existing.map((item) => item.filePath));
  const newFiles = mediaFiles.filter((filePath) => !existingPaths.has(filePath));

  if (newFiles.length) {
    await prisma.asset.createMany({
      data: newFiles.map((filePath) => ({
        accountId,
        filePath,
        fileType: fileTypeFor(filePath),
        sourceType: String(body.sourceType || "真实素材"),
        location: String(body.location || ""),
        shotAt: String(body.shotAt || ""),
        tags: String(body.tags || "批量导入, 真实素材"),
        suitableTypes: String(body.suitableTypes || "图生图 / 封面 / 图集素材"),
        coverReady: Boolean(body.coverReady),
        authorizationState: String(body.authorizationState || "已授权"),
        riskNotes: String(body.riskNotes || "本地文件夹批量登记；图改图前仍需确认素材与真实业务/经历一致。")
      }))
    });
  }

  return NextResponse.json({
    folderPath: absoluteFolderPath,
    found: mediaFiles.length,
    imported: newFiles.length,
    skipped: mediaFiles.length - newFiles.length,
    note: "已登记本地文件夹中的图片/视频。文件没有被复制，龙虾可直接读取该文件夹路径。"
  });
}
