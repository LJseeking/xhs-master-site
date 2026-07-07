import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildTaskPrompt } from "@/lib/prompt";
import { buildCommandSuggestions } from "@/lib/commands";
import { slugifyAccountName } from "@/lib/fsPaths";

export async function POST(_request: Request, context: { params: { id: string } }) {
  const id = Number(context.params.id);
  const noteTask = await prisma.noteTask.findUnique({
    where: { id },
    include: {
      account: {
        include: {
          strategy: true
        }
      },
      weeklyPlan: true
    }
  });
  if (!noteTask) return NextResponse.json({ error: "任务不存在" }, { status: 404 });

  const promptDir = path.join(process.cwd(), "prompts", slugifyAccountName(noteTask.account.name));
  await fs.mkdir(promptDir, { recursive: true });
  const promptFile = path.join("prompts", slugifyAccountName(noteTask.account.name), `note-${noteTask.id}.md`);
  const content = buildTaskPrompt({
    account: noteTask.account,
    strategy: noteTask.account.strategy,
    weeklyPlan: noteTask.weeklyPlan,
    noteTask
  });
  await fs.writeFile(path.join(process.cwd(), promptFile), content, "utf8");

  const prompt = await prisma.generatedPrompt.create({
    data: {
      accountId: noteTask.accountId,
      noteTaskId: noteTask.id,
      title: noteTask.topicTitle,
      content
    }
  });

  const commandData = buildCommandSuggestions(noteTask.account, noteTask, { promptFile })
    .filter((command) => command.category !== "生成封面/配图")
    .map((command) => ({
      accountId: noteTask.accountId,
      noteTaskId: noteTask.id,
      ...command
    }));
  await prisma.commandSuggestion.deleteMany({ where: { noteTaskId: noteTask.id } });
  await prisma.commandSuggestion.createMany({ data: commandData });
  await prisma.noteTask.update({ where: { id }, data: { status: "已生成Prompt" } });

  const commands = await prisma.commandSuggestion.findMany({ where: { noteTaskId: id }, orderBy: { id: "desc" }, take: 7 });
  return NextResponse.json({
    prompt,
    commands: commands.reverse()
  });
}
