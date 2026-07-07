import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { summarizeImageStyleStudyWithLlm } from "@/lib/llm";
import {
  buildImageStyleCommands,
  buildImageStyleKeywords,
  buildImageStyleResearchPrompt,
  summarizeImageStyleStudyFallback
} from "@/lib/imageStyleStudy";

export async function POST(request: Request, context: { params: { id: string } }) {
  const accountId = Number(context.params.id);
  const body = await request.json().catch(() => ({}));
  const action = body.action || "prepare";
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });

  if (action === "prepare") {
    const commands = buildImageStyleCommands(account);
    const researchPrompt = buildImageStyleResearchPrompt(account);
    const study = await prisma.accountImageStyleStudy.create({
      data: {
        accountId,
        searchKeywords: buildImageStyleKeywords(account),
        commandJson: JSON.stringify(commands, null, 2),
        researchPrompt,
        status: "待搜索"
      }
    });
    return NextResponse.json({ study, commands, researchPrompt });
  }

  if (action === "save-results") {
    const rawResults = String(body.rawResults || "");
    if (!rawResults.trim()) return NextResponse.json({ error: "请先粘贴 xiaohongshu_auto_op 返回的图片风格研究结果。" }, { status: 400 });

    const latestStudy =
      body.studyId
        ? await prisma.accountImageStyleStudy.findUnique({ where: { id: Number(body.studyId) } })
        : await prisma.accountImageStyleStudy.findFirst({ where: { accountId }, orderBy: { createdAt: "desc" } });

    const study =
      latestStudy ||
      (await prisma.accountImageStyleStudy.create({
        data: {
          accountId,
          searchKeywords: buildImageStyleKeywords(account),
          commandJson: JSON.stringify(buildImageStyleCommands(account), null, 2),
          researchPrompt: buildImageStyleResearchPrompt(account),
          status: "待总结"
        }
      }));

    const summaryResult = await summarizeImageStyleStudyWithLlm({
      account,
      rawResults,
      researchPrompt: study.researchPrompt
    });
    const fallback = summarizeImageStyleStudyFallback(account, rawResults);
    const summary = summaryResult.data || fallback;

    const savedStudy = await prisma.accountImageStyleStudy.update({
      where: { id: study.id },
      data: {
        rawResults,
        summaryMarkdown: summary.summaryMarkdown,
        styleBriefJson: JSON.stringify(summary.styleBrief, null, 2),
        status: summaryResult.usedLlm ? "已总结" : "已保存待复核"
      }
    });

    await prisma.systemLog.create({
      data: {
        accountId,
        level: summaryResult.usedLlm ? "info" : "warn",
        message: summaryResult.usedLlm ? "图片风格研究已由 OpenAI 总结" : "图片风格研究已保存，并使用本地规则生成摘要",
        meta: JSON.stringify({
          usedLlm: summaryResult.usedLlm,
          model: summaryResult.usedLlm ? summaryResult.model : "",
          error: summaryResult.usedLlm ? "" : summaryResult.error || ""
        })
      }
    });

    const full = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        strategy: true,
        profile: true,
        referenceResearches: { orderBy: { createdAt: "desc" }, take: 5 },
        imageStyleStudies: { orderBy: { createdAt: "desc" }, take: 5 },
        interactionPlans: { orderBy: { createdAt: "desc" }, take: 8 },
        assets: { orderBy: { createdAt: "desc" }, take: 50 },
        weeklyPlans: { orderBy: { createdAt: "desc" }, include: { noteTasks: true }, take: 10 }
      }
    });

    return NextResponse.json({
      account: full,
      study: savedStudy,
      summary,
      warning: summaryResult.usedLlm ? "" : summaryResult.error || "OpenAI 未完成总结，已使用本地规则生成图片风格摘要。"
    });
  }

  return NextResponse.json({ error: "未知 action" }, { status: 400 });
}
