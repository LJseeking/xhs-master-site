import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildNoteTasks } from "@/lib/weeklyPlan";
import { generateWeeklyTasksWithLlm } from "@/lib/llm";

export async function POST(request: Request) {
  const body = await request.json();
  const accountId = Number(body.accountId);
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: { strategy: true, assets: true }
  });
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });

  const plan = await prisma.weeklyPlan.create({
    data: {
      accountId,
      weekStart: body.weekStart || new Date().toISOString().slice(0, 10),
      theme: body.theme || "本周主题",
      goal: body.goal || "验证内容方向并积累可复用素材",
      frequency: Number(body.frequency || 5),
      ratio: body.ratio || "",
      testHypothesis: body.testHypothesis || "",
      commercializationMove: body.commercializationMove || "",
      interactionGoal: body.interactionGoal || "",
      availableAssets: body.availableAssets || "",
      taboos: body.taboos || ""
    }
  });

  const weeklyInput = { ...body, frequency: Number(body.frequency || 5) };
  const fallbackTasks = buildNoteTasks(account, account.strategy, account.assets, weeklyInput, plan);
  const llmResult = await generateWeeklyTasksWithLlm({
    account,
    strategy: account.strategy,
    assets: account.assets,
    weeklyPlan: plan,
    weeklyInput,
    fallbackTasks
  });
  await prisma.noteTask.createMany({ data: llmResult.data });
  await prisma.systemLog.create({
    data: {
      accountId,
      level: llmResult.usedLlm ? "info" : llmResult.error ? "warn" : "info",
      message: llmResult.usedLlm ? `使用 OpenAI API 生成一周 note_tasks：${plan.theme}` : `使用内置模板生成一周 note_tasks：${plan.theme}`,
      meta: JSON.stringify({ llm: llmResult.usedLlm, error: llmResult.usedLlm ? null : llmResult.error || null })
    }
  });

  const full = await prisma.weeklyPlan.findUnique({
    where: { id: plan.id },
    include: { noteTasks: { orderBy: { publishAt: "asc" } } }
  });
  return NextResponse.json(full);
}
