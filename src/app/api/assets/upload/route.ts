import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publicPathForAbsolute } from "@/lib/fsPaths";

function cleanFileName(name: string) {
  const cleaned = name
    .replace(/[\\/:*?"<>|#%{}^~[\]`]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || `素材-${Date.now()}`;
}

async function uniquePath(dir: string, fileName: string) {
  const parsed = path.parse(cleanFileName(fileName));
  let candidate = path.join(dir, `${parsed.name}${parsed.ext}`);
  let index = 2;
  while (true) {
    try {
      await fs.access(candidate);
      candidate = path.join(dir, `${parsed.name}-${index}${parsed.ext}`);
      index += 1;
    } catch {
      return candidate;
    }
  }
}

export async function POST(request: Request) {
  const form = await request.formData();
  const accountId = Number(form.get("accountId"));
  const files = [...form.getAll("files"), ...form.getAll("file")].filter((item): item is File => item instanceof File);
  if (!accountId || !files.length) {
    return NextResponse.json({ error: "缺少 accountId 或图片文件" }, { status: 400 });
  }
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });

  await fs.mkdir(account.assetsPath, { recursive: true });
  const assets = [];

  for (const file of files) {
    const absolutePath = await uniquePath(account.assetsPath, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absolutePath, buffer);

    const asset = await prisma.asset.create({
      data: {
        accountId,
        filePath: publicPathForAbsolute(absolutePath),
        fileType: file.type || "application/octet-stream",
        sourceType: String(form.get("sourceType") || "真实素材"),
        location: String(form.get("location") || ""),
        shotAt: String(form.get("shotAt") || ""),
        tags: String(form.get("tags") || ""),
        suitableTypes: String(form.get("suitableTypes") || ""),
        coverReady: form.get("coverReady") === "true",
        authorizationState: String(form.get("authorizationState") || "待确认"),
        riskNotes: String(form.get("riskNotes") || "")
      }
    });
    assets.push({ ...asset, localFilePath: absolutePath });
  }

  return NextResponse.json({ count: assets.length, assets });
}
