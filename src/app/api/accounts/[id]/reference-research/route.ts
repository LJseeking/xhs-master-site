import { NextResponse } from "next/server";
import { z } from "zod";
import { buildAccountStrategy } from "@/lib/strategy";
import { regenerateStrategyFromReferenceResearchWithLlm, summarizeReferenceResearchWithLlm } from "@/lib/llm";
import { getTemplateByKey } from "@/data/accountTypeTemplates";
import {
  buildReferenceResearchCommands,
  buildReferenceResearchKeywords,
  buildReferenceResearchPrompt
} from "@/lib/referenceResearch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const accountSchema = z.object({
  id: z.number(),
  name: z.string(),
  accountParam: z.string().default(""),
  accountType: z.string(),
  stage: z.string().default("冷启动"),
  personaBase: z.string().default(""),
  city: z.string().default(""),
  targetUsers: z.string().default(""),
  painPoints: z.string().default(""),
  contentDirections: z.string().default(""),
  businessGoals: z.string().default(""),
  monetization: z.string().default(""),
  referenceAccounts: z.string().default(""),
  materialCondition: z.string().default(""),
  taboos: z.string().default(""),
  profilePath: z.string().default(""),
  assetsPath: z.string().default(""),
  profile: z
    .object({
      content: z.string().default(""),
      version: z.number().default(1),
      path: z.string().default("")
    })
    .nullable()
    .optional()
});

const bodySchema = z.object({
  action: z.enum(["prepare", "save-results"]).default("prepare"),
  account: accountSchema,
  researchId: z.number().optional(),
  rawResults: z.string().optional(),
  selectedAccounts: z.string().optional()
});

function getErrorMessage(error: unknown) {
  if (error instanceof z.ZodError) return error.issues[0]?.message || "请求参数不合法";
  if (error instanceof Error) return error.message;
  return "爆款研究处理失败";
}

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json().catch(() => ({})));
    const account = {
      ...body.account,
      createdAt: new Date(0),
      updatedAt: new Date(0)
    };
    const templateSeed = getTemplateByKey(account.accountType);
    const template = {
      id: 0,
      typeKey: templateSeed.typeKey,
      name: templateSeed.name,
      defaultColumns: JSON.stringify(templateSeed.defaultColumns),
      weeklyRatio: JSON.stringify(templateSeed.weeklyRatio),
      imageStrategy: JSON.stringify(templateSeed.imageStrategy),
      titleStrategy: JSON.stringify(templateSeed.titleStrategy),
      coverStrategy: JSON.stringify(templateSeed.coverStrategy),
      interactionStrategy: JSON.stringify(templateSeed.interactionStrategy),
      commercializationPath: JSON.stringify(templateSeed.commercializationPath),
      riskRules: JSON.stringify(templateSeed.riskRules),
      promptRules: JSON.stringify(templateSeed.promptRules),
      createdAt: new Date(0),
      updatedAt: new Date(0)
    };

    if (body.action === "prepare") {
      const commands = buildReferenceResearchCommands(account as never, template as never);
      const researchPrompt = buildReferenceResearchPrompt(account as never, template as never);
      const research = {
        id: body.researchId || Date.now(),
        accountId: account.id,
        searchKeywords: buildReferenceResearchKeywords(account as never, template as never),
        commandJson: JSON.stringify(commands, null, 2),
        researchPrompt,
        rawResults: "",
        selectedAccounts: "",
        summaryMarkdown: "",
        contentFeatures: "",
        personaInsights: "",
        strategyInsights: "",
        status: "待搜索"
      };
      return NextResponse.json({ research, commands, researchPrompt });
    }

    const rawResults = String(body.rawResults || "");
    const selectedAccounts = String(body.selectedAccounts || "");
    if (!rawResults.trim()) {
      return NextResponse.json({ error: "请先粘贴 xiaohongshu_auto_op 返回结果。" }, { status: 400 });
    }

    const summaryResult = await summarizeReferenceResearchWithLlm({
      account: account as never,
      template: template as never,
      rawResults,
      selectedAccounts
    });

    if (!summaryResult.usedLlm) {
      return NextResponse.json(
        { error: `OpenAI API 未能完成参考账号总结：${summaryResult.error || "未知错误"}` },
        { status: 502 }
      );
    }

    const research = {
      id: body.researchId || Date.now(),
      accountId: account.id,
      searchKeywords: buildReferenceResearchKeywords(account as never, template as never),
      commandJson: JSON.stringify(buildReferenceResearchCommands(account as never, template as never), null, 2),
      researchPrompt: buildReferenceResearchPrompt(account as never, template as never),
      rawResults,
      selectedAccounts,
      summaryMarkdown: summaryResult.data.summaryMarkdown,
      contentFeatures: summaryResult.data.contentFeatures,
      personaInsights: summaryResult.data.personaInsights,
      strategyInsights: summaryResult.data.strategyInsights,
      status: "已总结"
    };

    const updatedAccount = {
      ...account,
      referenceAccounts: [
        selectedAccounts ? `## 人工标记参考账号\n${selectedAccounts}` : "",
        `## 参考账号内容特色\n${summaryResult.data.contentFeatures}`,
        `## 人设洞察\n${summaryResult.data.personaInsights}`,
        `## 策略洞察\n${summaryResult.data.strategyInsights}`
      ]
        .filter(Boolean)
        .join("\n\n")
    };

    const fallbackStrategy = buildAccountStrategy(updatedAccount as never, template as never);
    const strategyResult = await regenerateStrategyFromReferenceResearchWithLlm({
      account: updatedAccount as never,
      template: template as never,
      referenceSummary: {
        summaryMarkdown: research.summaryMarkdown,
        contentFeatures: research.contentFeatures,
        personaInsights: research.personaInsights,
        strategyInsights: research.strategyInsights,
        rawResults: research.rawResults,
        selectedAccounts: research.selectedAccounts
      },
      fallback: fallbackStrategy
    });

    if (!strategyResult.usedLlm) {
      return NextResponse.json(
        { error: `OpenAI API 未能基于爆款研究重生成策划案：${strategyResult.error || "未知错误"}`, research },
        { status: 502 }
      );
    }

    return NextResponse.json({
      research,
      summary: summaryResult.data,
      account: {
        ...updatedAccount,
        strategy: {
          markdown: strategyResult.data.markdown,
          positioning: strategyResult.data.positioning,
          execGuide: strategyResult.data.execGuide
        },
        profile: {
          content: strategyResult.data.agentsMdContent,
          version: (body.account.profile?.version || 0) + 1,
          path: body.account.profile?.path || body.account.profilePath || ""
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}
