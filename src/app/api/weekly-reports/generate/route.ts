import { NextResponse } from "next/server";
import { buildWeeklyReportPrompt } from "@/lib/report";

export async function POST(request: Request) {
  const body = await request.json();
  const account = body.account && typeof body.account === "object" ? body.account : null;
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });
  const prompt = buildWeeklyReportPrompt({
    accountName: account.name,
    accountType: account.accountType,
    reviewMode: body.reviewMode || "",
    weekLabel: body.weekLabel || "本周",
    rows: body.rows || [],
    subjective: body.subjective || "",
    expertFeedback: body.expertFeedback || "",
    editComparison: body.editComparison || "",
    effectivePatterns: body.effectivePatterns || "",
    failedPatterns: body.failedPatterns || "",
    distillGoal: body.distillGoal || ""
  });
  const report = {
    id: Date.now(),
    accountId: account.id,
    weeklyPlanId: body.weeklyPlanId ? Number(body.weeklyPlanId) : null,
    inputJson: JSON.stringify(body, null, 2),
    prompt,
    createdAt: new Date().toISOString()
  };
  return NextResponse.json(report);
}
