import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLlmStatus, summarizeInteractionCandidatesWithLlm } from "@/lib/llm";
import {
  buildInteractionCommands,
  buildInteractionCommentPrompt,
  buildInteractionDiscoveryPrompt,
  buildInteractionKeywords,
  fallbackInteractionSummary
} from "@/lib/interactionPrompts";

const accountInclude = {
  strategy: true,
  profile: true,
  referenceResearches: { orderBy: { createdAt: "desc" as const }, take: 5 },
  interactionPlans: { orderBy: { createdAt: "desc" as const }, take: 8 },
  assets: { orderBy: { createdAt: "desc" as const }, take: 50 },
  weeklyPlans: { orderBy: { createdAt: "desc" as const }, include: { noteTasks: true }, take: 10 }
};

export async function POST(request: Request, context: { params: { id: string } }) {
  const accountId = Number(context.params.id);
  const body = await request.json();
  const action = body.action || "prepare";

  const account = await prisma.account.findUnique({ where: { id: accountId }, include: { strategy: true } });
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });

  const noteTaskId = body.noteTaskId ? Number(body.noteTaskId) : null;
  const noteTask = noteTaskId ? await prisma.noteTask.findUnique({ where: { id: noteTaskId } }) : null;
  if (noteTaskId && (!noteTask || noteTask.accountId !== accountId)) {
    return NextResponse.json({ error: "笔记任务不存在或不属于当前账号" }, { status: 404 });
  }

  if (action === "prepare") {
    const publishedNoteUrl = String(body.publishedNoteUrl || "");
    const interactionGoal = String(body.interactionGoal || "");
    const commands = buildInteractionCommands(account, noteTask, { publishedNoteUrl, interactionGoal });
    const discoveryPrompt = buildInteractionDiscoveryPrompt({
      account,
      strategy: account.strategy,
      noteTask,
      publishedNoteUrl,
      interactionGoal
    });
    const commentPrompt = buildInteractionCommentPrompt({ account, noteTask, discoveryPrompt });
    const plan = await prisma.accountInteractionPlan.create({
      data: {
        accountId,
        noteTaskId,
        searchKeywords: publishedNoteUrl || buildInteractionKeywords(account, noteTask),
        commandJson: JSON.stringify(commands, null, 2),
        discoveryPrompt,
        commentPrompt,
        status: "已生成互动指令"
      }
    });

    await prisma.systemLog.create({
      data: {
        accountId,
        level: "info",
        message: "已发布笔记互动指令已生成",
        meta: JSON.stringify({ noteTaskId, publishedNoteUrl, interactionGoal, mode: "prompt_command_only" })
      }
    });

    return NextResponse.json({ plan, commands, discoveryPrompt, commentPrompt });
  }

  if (action === "save-results") {
    const rawResults = String(body.rawResults || "");
    if (!rawResults.trim()) return NextResponse.json({ error: "请先粘贴 xiaohongshu_auto_op 返回结果。" }, { status: 400 });

    const latestPlan =
      body.planId
        ? await prisma.accountInteractionPlan.findUnique({ where: { id: Number(body.planId) } })
        : await prisma.accountInteractionPlan.findFirst({ where: { accountId }, orderBy: { createdAt: "desc" } });

    const plan =
      latestPlan ||
      (await prisma.accountInteractionPlan.create({
        data: {
          accountId,
          noteTaskId,
          searchKeywords: buildInteractionKeywords(account, noteTask),
          commandJson: JSON.stringify(buildInteractionCommands(account, noteTask), null, 2),
          discoveryPrompt: buildInteractionDiscoveryPrompt({ account, strategy: account.strategy, noteTask }),
          commentPrompt: buildInteractionCommentPrompt({
            account,
            noteTask,
            discoveryPrompt: buildInteractionDiscoveryPrompt({ account, strategy: account.strategy, noteTask })
          }),
          status: "待总结"
        }
      }));

    const summaryResult = getLlmStatus().enabled
      ? await summarizeInteractionCandidatesWithLlm({
          account,
          strategy: account.strategy,
          noteTask,
          rawResults,
          discoveryPrompt: plan.discoveryPrompt,
          commentPrompt: plan.commentPrompt
        })
      : { usedLlm: false as const, data: fallbackInteractionSummary(rawResults), error: "OPENAI_API_KEY 未配置" };

    const savedPlan = await prisma.accountInteractionPlan.update({
      where: { id: plan.id },
      data: {
        rawResults,
        targetUsersMarkdown: summaryResult.data.targetUsersMarkdown,
        commentDraftsMarkdown: summaryResult.data.commentDraftsMarkdown,
        status: summaryResult.usedLlm ? "已生成互动策略" : "已保存待总结"
      }
    });

    await prisma.systemLog.create({
      data: {
        accountId,
        level: summaryResult.usedLlm ? "info" : "warn",
        message: summaryResult.usedLlm ? "目标用户互动策略已由大模型生成" : "目标用户搜索结果已保存，但大模型总结未完成",
        meta: JSON.stringify({ llm: summaryResult.usedLlm, error: summaryResult.usedLlm ? null : summaryResult.error || null })
      }
    });

    const full = await prisma.account.findUnique({ where: { id: accountId }, include: accountInclude });

    return NextResponse.json({
      account: full,
      plan: savedPlan,
      summary: summaryResult.data,
      warning: summaryResult.usedLlm ? "" : summaryResult.error || "大模型总结未完成，已保存原始结果。"
    });
  }

  return NextResponse.json({ error: "未知 action" }, { status: 400 });
}
