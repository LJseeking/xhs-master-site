import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugifyAccountName } from "@/lib/fsPaths";
import { buildBatchImagePostsCommands, buildBatchImagePostsPrompt } from "@/lib/batchImagePosts";

export async function POST(request: Request, context: { params: { id: string } }) {
  const accountId = Number(context.params.id);
  const body = await request.json().catch(() => ({}));
  const weeks = Number(body.weeks) === 2 ? 2 : 1;
  const openclawAssetsDir = String(body.openclawAssetsDir || "");
  const openclawImagePaths = String(body.openclawImagePaths || "");
  const planningGoal = String(body.planningGoal || "");

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: {
      assets: { orderBy: { createdAt: "desc" }, take: 100 },
      imageStyleStudies: { orderBy: { createdAt: "desc" }, take: 1 },
      referenceResearches: { orderBy: { createdAt: "desc" }, take: 1 }
    }
  });
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });

  const promptDir = path.join(process.cwd(), "prompts", slugifyAccountName(account.name));
  await fs.mkdir(promptDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const promptFile = path.join("prompts", slugifyAccountName(account.name), `batch-image-posts-${weeks}w-${stamp}.md`);
  const content = buildBatchImagePostsPrompt(account, {
    weeks,
    openclawAssetsDir,
    openclawImagePaths,
    planningGoal
  });
  await fs.writeFile(path.join(process.cwd(), promptFile), content, "utf8");

  const commands = buildBatchImagePostsCommands(account, {
    weeks,
    openclawAssetsDir,
    openclawImagePaths,
    planningGoal,
    promptFile
  });

  await prisma.systemLog.create({
    data: {
      accountId,
      level: "info",
      message: "批量图片帖子生成 Prompt 已生成",
      meta: JSON.stringify({
        weeks,
        promptFile,
        assetsDir: openclawAssetsDir || account.assetsPath,
        hasImagePaths: Boolean(openclawImagePaths.trim()),
        hasPlanningGoal: Boolean(planningGoal.trim())
      })
    }
  });

  return NextResponse.json({
    planningPrompt: {
      title: `${account.name} 批量图片帖子生成`,
      content,
      path: promptFile
    },
    commands
  });
}
