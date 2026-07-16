import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { buildTaskPrompt } from "@/lib/prompt";
import { buildCommandSuggestions } from "@/lib/commands";
import { slugifyAccountName } from "@/lib/fsPaths";
import { formatExpertRulesForPrompt } from "@/lib/expertLearning";

export async function POST(request: Request, _context: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const noteTask = body.noteTask;
  const account = body.account;
  const weeklyPlan = body.weeklyPlan;
  if (!noteTask || !account || !weeklyPlan) return NextResponse.json({ error: "缺少任务上下文" }, { status: 400 });

  const promptDir = path.join(process.cwd(), "prompts", slugifyAccountName(account.name));
  await fs.mkdir(promptDir, { recursive: true });
  const promptFile = path.join("prompts", slugifyAccountName(account.name), `note-${noteTask.id}.md`);
  const content = buildTaskPrompt({
    account,
    strategy: account.strategy,
    weeklyPlan,
    noteTask,
    expertRules: formatExpertRulesForPrompt(account.expertRules || [])
  });
  await fs.writeFile(path.join(process.cwd(), promptFile), content, "utf8");

  const prompt = {
    id: Date.now(),
    accountId: account.id,
    noteTaskId: noteTask.id,
    title: noteTask.topicTitle,
    content
  };

  const commands = buildCommandSuggestions(account, noteTask, { promptFile })
    .filter((command) => command.category !== "生成封面/配图");

  return NextResponse.json({
    prompt,
    commands
  });
}
