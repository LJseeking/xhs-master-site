import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildAccountStrategy } from "@/lib/strategy";
import { getLlmStatus, regenerateStrategyFromReferenceResearchWithLlm, summarizeReferenceResearchWithLlm } from "@/lib/llm";
import {
  buildReferenceResearchCommands,
  buildReferenceResearchKeywords,
  buildReferenceResearchPrompt
} from "@/lib/referenceResearch";

export async function POST(request: Request, context: { params: { id: string } }) {
  const accountId = Number(context.params.id);
  const body = await request.json();
  const action = body.action || "prepare";
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });

  const template = await prisma.accountTypeTemplate.findUnique({ where: { typeKey: account.accountType } });
  if (!template) return NextResponse.json({ error: "账号类型模板不存在" }, { status: 404 });

  if (action === "prepare") {
    const commands = buildReferenceResearchCommands(account, template);
    const researchPrompt = buildReferenceResearchPrompt(account, template);
    const research = await prisma.accountReferenceResearch.create({
      data: {
        accountId,
        searchKeywords: buildReferenceResearchKeywords(account, template),
        commandJson: JSON.stringify(commands, null, 2),
        researchPrompt,
        status: "待搜索"
      }
    });
    return NextResponse.json({ research, commands, researchPrompt });
  }

  if (action === "save-results") {
    const rawResults = String(body.rawResults || "");
    const selectedAccounts = String(body.selectedAccounts || "");
    if (!rawResults.trim()) return NextResponse.json({ error: "请先粘贴 xiaohongshu_auto_op 返回结果。" }, { status: 400 });

    const latestResearch =
      body.researchId
        ? await prisma.accountReferenceResearch.findUnique({ where: { id: Number(body.researchId) } })
        : await prisma.accountReferenceResearch.findFirst({ where: { accountId }, orderBy: { createdAt: "desc" } });

    const research =
      latestResearch ||
      (await prisma.accountReferenceResearch.create({
        data: {
          accountId,
          searchKeywords: buildReferenceResearchKeywords(account, template),
          commandJson: JSON.stringify(buildReferenceResearchCommands(account, template), null, 2),
          researchPrompt: buildReferenceResearchPrompt(account, template),
          status: "待总结"
        }
      }));

    if (!getLlmStatus().enabled) {
      const savedResearch = await prisma.accountReferenceResearch.update({
        where: { id: research.id },
        data: {
          rawResults,
          selectedAccounts,
          status: "待 OpenAI 总结"
        }
      });
      await prisma.systemLog.create({
        data: {
          accountId,
          level: "warn",
          message: "参考账号研究原始结果已保存，但未配置 OpenAI API，未重生成策划案与 AGENTS.md",
          meta: JSON.stringify({ llm: false, error: "OPENAI_API_KEY 未配置" })
        }
      });
      return NextResponse.json(
        {
          error: "已保存参考账号研究原始结果，但 OPENAI_API_KEY 未配置。请配置 OpenAI API 后再执行总结与重生成。",
          research: savedResearch
        },
        { status: 400 }
      );
    }

    const summaryResult = await summarizeReferenceResearchWithLlm({
      account,
      template,
      rawResults,
      selectedAccounts
    });

    if (!summaryResult.usedLlm) {
      await prisma.accountReferenceResearch.update({
        where: { id: research.id },
        data: {
          rawResults,
          selectedAccounts,
          status: "OpenAI 总结失败"
        }
      });
      return NextResponse.json(
        { error: `OpenAI API 未能完成参考账号总结：${summaryResult.error || "未知错误"}` },
        { status: 502 }
      );
    }

    const savedResearch = await prisma.accountReferenceResearch.update({
      where: { id: research.id },
      data: {
        rawResults,
        selectedAccounts,
        summaryMarkdown: summaryResult.data.summaryMarkdown,
        contentFeatures: summaryResult.data.contentFeatures,
        personaInsights: summaryResult.data.personaInsights,
        strategyInsights: summaryResult.data.strategyInsights,
        status: summaryResult.usedLlm ? "已总结" : "已保存待总结"
      }
    });

    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: {
        referenceAccounts: [
          selectedAccounts ? `## 人工标记参考账号\n${selectedAccounts}` : "",
          `## 参考账号内容特色\n${summaryResult.data.contentFeatures}`,
          `## 人设洞察\n${summaryResult.data.personaInsights}`,
          `## 策略洞察\n${summaryResult.data.strategyInsights}`
        ]
          .filter(Boolean)
          .join("\n\n")
      }
    });

    const fallbackStrategy = buildAccountStrategy(updatedAccount, template);
    const strategyResult = await regenerateStrategyFromReferenceResearchWithLlm({
      account: updatedAccount,
      template,
      referenceSummary: {
        summaryMarkdown: savedResearch.summaryMarkdown,
        contentFeatures: savedResearch.contentFeatures,
        personaInsights: savedResearch.personaInsights,
        strategyInsights: savedResearch.strategyInsights,
        rawResults: savedResearch.rawResults,
        selectedAccounts: savedResearch.selectedAccounts
      },
      fallback: fallbackStrategy
    });

    if (!strategyResult.usedLlm) {
      await prisma.accountReferenceResearch.update({
        where: { id: research.id },
        data: { status: "OpenAI 重生成失败" }
      });
      return NextResponse.json(
        { error: `OpenAI API 未能基于参考账号研究重生成策划案：${strategyResult.error || "未知错误"}`, research: savedResearch },
        { status: 502 }
      );
    }

    const strategy = strategyResult.data;
    await fs.writeFile(updatedAccount.profilePath, strategy.agentsMdContent, "utf8");

    await prisma.accountStrategy.upsert({
      where: { accountId },
      update: {
        positioning: strategy.positioning,
        strategyJson: strategy.strategyJson,
        markdown: strategy.markdown,
        agentsMdContent: strategy.agentsMdContent,
        execGuide: strategy.execGuide
      },
      create: {
        accountId,
        positioning: strategy.positioning,
        strategyJson: strategy.strategyJson,
        markdown: strategy.markdown,
        agentsMdContent: strategy.agentsMdContent,
        execGuide: strategy.execGuide
      }
    });

    const profile = await prisma.accountProfile.findUnique({ where: { accountId } });
    const versions = profile ? JSON.parse(profile.versions || "[]") : [];
    versions.push({
      version: profile ? profile.version + 1 : 1,
      savedAt: new Date().toISOString(),
      reason: "reference-research-regenerate",
      content: strategy.agentsMdContent
    });
    await prisma.accountProfile.upsert({
      where: { accountId },
      update: {
        content: strategy.agentsMdContent,
        version: profile ? profile.version + 1 : 1,
        versions: JSON.stringify(versions)
      },
      create: {
        accountId,
        path: updatedAccount.profilePath,
        content: strategy.agentsMdContent,
        versions: JSON.stringify(versions)
      }
    });

    await prisma.systemLog.create({
      data: {
        accountId,
        level: "info",
        message: "OpenAI 已基于参考账号研究重生成策划案与 AGENTS.md",
        meta: JSON.stringify({
          researchLlm: true,
          strategyLlm: true,
          model: strategyResult.model
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

    return NextResponse.json({ account: full, research: savedResearch, summary: summaryResult.data });
  }

  return NextResponse.json({ error: "未知 action" }, { status: 400 });
}
