import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { slugifyAccountName } from "@/lib/fsPaths";
import { buildBatchImagePostsCommands, buildBatchImagePostsPrompt } from "@/lib/batchImagePosts";

export async function POST(request: Request, context: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const weeks = Number(body.weeks) === 2 ? 2 : 1;
  const openclawImagePaths = String(body.openclawImagePaths || "");
  const planningGoal = String(body.planningGoal || "");
  const accountSnapshot = body.account && typeof body.account === "object" ? body.account : null;
  const account = accountSnapshot;
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });

  const promptDir = path.join(process.cwd(), "prompts", slugifyAccountName(account.name));
  await fs.mkdir(promptDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const promptFile = path.join("prompts", slugifyAccountName(account.name), `batch-image-posts-${weeks}w-${stamp}.md`);
  const content = buildBatchImagePostsPrompt(account, {
    weeks,
    openclawImagePaths,
    planningGoal
  });
  await fs.writeFile(path.join(process.cwd(), promptFile), content, "utf8");

  const commands = buildBatchImagePostsCommands(account, {
    weeks,
    openclawImagePaths,
    planningGoal,
    promptFile
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
