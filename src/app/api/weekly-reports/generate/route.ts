import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildWeeklyReportPrompt } from "@/lib/report";

export async function POST(request: Request) {
  const body = await request.json();
  const accountId = Number(body.accountId);
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });
  const prompt = buildWeeklyReportPrompt({
    accountName: account.name,
    weekLabel: body.weekLabel || "本周",
    rows: body.rows || [],
    subjective: body.subjective || ""
  });
  const report = await prisma.weeklyReport.create({
    data: {
      accountId,
      weeklyPlanId: body.weeklyPlanId ? Number(body.weeklyPlanId) : null,
      inputJson: JSON.stringify(body, null, 2),
      prompt
    }
  });
  return NextResponse.json(report);
}
