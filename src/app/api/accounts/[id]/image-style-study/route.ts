import { NextResponse } from "next/server";
import { summarizeImageStyleStudyWithLlm } from "@/lib/llm";
import {
  buildImageStyleCommands,
  buildImageStyleKeywords,
  buildImageStyleResearchPrompt,
  summarizeImageStyleStudyFallback
} from "@/lib/imageStyleStudy";

export async function POST(request: Request, context: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const action = body.action || "prepare";
  const account = body.account && typeof body.account === "object" ? body.account : null;
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });

  if (action === "prepare") {
    const commands = buildImageStyleCommands(account);
    const researchPrompt = buildImageStyleResearchPrompt(account);
    const study = {
      id: Number(body.studyId) || Date.now(),
      accountId: account.id,
      searchKeywords: buildImageStyleKeywords(account),
      commandJson: JSON.stringify(commands, null, 2),
      researchPrompt,
      rawResults: "",
      summaryMarkdown: "",
      styleBriefJson: "[]",
      status: "待搜索"
    };
    return NextResponse.json({ study, commands, researchPrompt });
  }

  if (action === "save-results") {
    const rawResults = String(body.rawResults || "");
    if (!rawResults.trim()) return NextResponse.json({ error: "请先粘贴 xiaohongshu_auto_op 返回的图片风格研究结果。" }, { status: 400 });

    const study = {
      id: Number(body.studyId) || Date.now(),
      accountId: account.id,
      searchKeywords: buildImageStyleKeywords(account),
      commandJson: JSON.stringify(buildImageStyleCommands(account), null, 2),
      researchPrompt: buildImageStyleResearchPrompt(account),
      status: "待总结"
    };

    const summaryResult = await summarizeImageStyleStudyWithLlm({
      account,
      rawResults,
      researchPrompt: study.researchPrompt
    });
    const fallback = summarizeImageStyleStudyFallback(account, rawResults);
    const summary = summaryResult.data || fallback;

    const savedStudy = {
      ...study,
      rawResults,
      summaryMarkdown: summary.summaryMarkdown,
      styleBriefJson: JSON.stringify(summary.styleBrief, null, 2),
      status: summaryResult.usedLlm ? "已总结" : "已保存待复核"
    };

    return NextResponse.json({
      study: savedStudy,
      summary,
      warning: summaryResult.usedLlm ? "" : summaryResult.error || "OpenAI 未完成总结，已使用本地规则生成图片风格摘要。"
    });
  }

  return NextResponse.json({ error: "未知 action" }, { status: 400 });
}
