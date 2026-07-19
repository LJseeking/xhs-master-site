import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { slugifyAccountName } from "@/lib/fsPaths";
import { assertWeddingAccount, buildWeddingImagePlanCommands, buildWeddingImagePlanPrompt } from "@/lib/weddingImagePlanning";

export async function POST(request: Request, context: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const weeks = Number(body.weeks) === 2 ? 2 : 1;
  const openclawImagePaths = String(body.openclawImagePaths || "");
  const planningGoal = String(body.planningGoal || "");
  const account = body.account && typeof body.account === "object" ? body.account : null;
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });

  try {
    assertWeddingAccount(account);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "当前账号不适合婚礼图片规划。" }, { status: 400 });
  }

  const promptDir = path.join(process.cwd(), "prompts", slugifyAccountName(account.name));
  await fs.mkdir(promptDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const promptFile = path.join("prompts", slugifyAccountName(account.name), `wedding-image-plan-${weeks}w-${stamp}.md`);
  const content = buildWeddingImagePlanPrompt(account, {
    weeks,
    openclawImagePaths,
    planningGoal
  });
  await fs.writeFile(path.join(process.cwd(), promptFile), content, "utf8");

  const commands = buildWeddingImagePlanCommands(account, {
    weeks,
    openclawImagePaths,
    planningGoal,
    promptFile
  });

  return NextResponse.json({
    planningPrompt: {
      title: `${account.name} 婚礼批量帖子生成`,
      content,
      path: promptFile
    },
    commands
  });
}
