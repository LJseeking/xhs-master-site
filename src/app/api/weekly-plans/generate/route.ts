import { NextResponse } from "next/server";
import { buildNoteTasks } from "@/lib/weeklyPlan";
import { generateWeeklyTasksWithLlm } from "@/lib/llm";

export async function POST(request: Request) {
  const body = await request.json();
  const account = body.account;
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });

  const plan = {
    id: Date.now(),
    accountId: account.id,
    weekStart: body.weekStart || new Date().toISOString().slice(0, 10),
    theme: body.theme || "本周主题",
    goal: body.goal || "验证内容方向并积累可复用素材",
    frequency: Number(body.frequency || 5),
    ratio: body.ratio || "",
    testHypothesis: body.testHypothesis || "",
    commercializationMove: body.commercializationMove || "",
    interactionGoal: body.interactionGoal || "",
    availableAssets: body.availableAssets || "",
    taboos: body.taboos || "",
    status: "draft",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const weeklyInput = { ...body, frequency: Number(body.frequency || 5) };
  const fallbackTasks = buildNoteTasks(account, account.strategy, account.assets || [], weeklyInput, plan);
  const llmResult = await generateWeeklyTasksWithLlm({
    account,
    strategy: account.strategy,
    assets: account.assets || [],
    weeklyPlan: plan,
    weeklyInput,
    fallbackTasks
  });
  return NextResponse.json({
    ...plan,
    noteTasks: llmResult.data.map((task, index) => ({ ...task, id: Date.now() + index }))
  });
}
