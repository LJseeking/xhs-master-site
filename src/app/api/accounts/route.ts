import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ensureAccountDirs } from "@/lib/fsPaths";
import { buildAccountStrategy } from "@/lib/strategy";
import { generateStrategyWithLlm } from "@/lib/llm";
import { accountTypeTemplates, normalizeAccountTypeKey } from "@/data/accountTypeTemplates";

const accountSchema = z.object({
  name: z.string().min(1),
  accountParam: z.string().min(1),
  accountType: z.string().min(1),
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
  taboos: z.string().default("")
});

function isMissingTableError(error: unknown) {
  return error instanceof Error && error.message.includes("does not exist in the current database");
}

function getErrorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message || "请求参数不合法";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "服务异常，请稍后重试。";
}

function buildFallbackTemplates() {
  return accountTypeTemplates.map((template, index) => ({
    id: index + 1,
    typeKey: template.typeKey,
    name: template.name,
    defaultColumns: JSON.stringify(template.defaultColumns),
    weeklyRatio: JSON.stringify(template.weeklyRatio),
    imageStrategy: JSON.stringify(template.imageStrategy),
    titleStrategy: JSON.stringify(template.titleStrategy),
    coverStrategy: JSON.stringify(template.coverStrategy),
    interactionStrategy: JSON.stringify(template.interactionStrategy),
    commercializationPath: JSON.stringify(template.commercializationPath),
    riskRules: JSON.stringify(template.riskRules),
    promptRules: JSON.stringify(template.promptRules),
    createdAt: new Date(0),
    updatedAt: new Date(0)
  }));
}

async function getExistingTableNames() {
  const rows = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
    "SELECT name FROM sqlite_master WHERE type='table'"
  );
  return new Set(rows.map((row) => row.name));
}

function buildAccountInclude(existingTables?: Set<string>) {
  const has = (tableName: string) => !existingTables || existingTables.has(tableName);

  return {
    strategy: true,
    profile: true,
    ...(has("account_reference_researches")
      ? { referenceResearches: { orderBy: { createdAt: "desc" as const }, take: 5 } }
      : {}),
    ...(has("account_image_style_studies")
      ? { imageStyleStudies: { orderBy: { createdAt: "desc" as const }, take: 5 } }
      : {}),
    ...(has("account_interaction_plans")
      ? { interactionPlans: { orderBy: { createdAt: "desc" as const }, take: 8 } }
      : {}),
    ...(has("post_reviews")
      ? { postReviews: { orderBy: { createdAt: "desc" as const }, take: 8 } }
      : {}),
    ...(has("expert_rules")
      ? { expertRules: { orderBy: { createdAt: "desc" as const }, take: 20 } }
      : {}),
    ...(has("industry_knowledge_researches")
      ? { industryKnowledgeResearches: { orderBy: { createdAt: "desc" as const }, take: 5 } }
      : {}),
    ...(has("assets") ? { assets: { orderBy: { createdAt: "desc" as const }, take: 50 } } : {}),
    ...(has("weekly_plans")
      ? { weeklyPlans: { orderBy: { createdAt: "desc" as const }, include: { noteTasks: true }, take: 10 } }
      : {})
  };
}

export async function GET() {
  try {
    const templateOrder = new Map(accountTypeTemplates.map((template, index) => [template.typeKey, index]));
    const existingTables = await getExistingTableNames();
    const [accounts, templates] = await Promise.all([
      prisma.account.findMany({
        orderBy: { updatedAt: "desc" },
        include: buildAccountInclude(existingTables)
      }),
      prisma.accountTypeTemplate.findMany({ orderBy: { id: "asc" } })
    ]);
    const sortedTemplates = [...templates].sort(
      (a, b) => (templateOrder.get(a.typeKey) ?? 999) - (templateOrder.get(b.typeKey) ?? 999)
    );
    return NextResponse.json({ accounts, templates: sortedTemplates });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({
        accounts: [],
        templates: buildFallbackTemplates(),
        error: "本地数据库尚未初始化，已临时使用内置模板。创建账号前请先初始化本地数据。"
      });
    }
    return NextResponse.json({ error: getErrorMessage(error), accounts: [], templates: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = accountSchema.parse(await request.json());
    const dirs = await ensureAccountDirs(body.name);
    const normalizedTypeKey = normalizeAccountTypeKey(body.accountType);

    let template = await prisma.accountTypeTemplate.findUnique({ where: { typeKey: normalizedTypeKey } }).catch((error) => {
      if (isMissingTableError(error)) return null;
      throw error;
    });

    if (!template) {
      const fallbackTemplate = accountTypeTemplates.find((item) => item.typeKey === normalizedTypeKey);
      if (fallbackTemplate) {
        template = {
          id: 0,
          typeKey: fallbackTemplate.typeKey,
          name: fallbackTemplate.name,
          defaultColumns: JSON.stringify(fallbackTemplate.defaultColumns),
          weeklyRatio: JSON.stringify(fallbackTemplate.weeklyRatio),
          imageStrategy: JSON.stringify(fallbackTemplate.imageStrategy),
          titleStrategy: JSON.stringify(fallbackTemplate.titleStrategy),
          coverStrategy: JSON.stringify(fallbackTemplate.coverStrategy),
          interactionStrategy: JSON.stringify(fallbackTemplate.interactionStrategy),
          commercializationPath: JSON.stringify(fallbackTemplate.commercializationPath),
          riskRules: JSON.stringify(fallbackTemplate.riskRules),
          promptRules: JSON.stringify(fallbackTemplate.promptRules),
          createdAt: new Date(0),
          updatedAt: new Date(0)
        };
      }
    }

    if (!template) {
      return NextResponse.json({ error: "未知账号类型，请先运行 npm run db:init 初始化模板。" }, { status: 400 });
    }

    const account = await prisma.account.create({
      data: {
        ...body,
        accountType: normalizedTypeKey,
        profilePath: dirs.profilePath,
        assetsPath: dirs.assetsPath
      }
    });

    const fallbackStrategy = buildAccountStrategy(account, template);
    const strategyResult = await generateStrategyWithLlm(account, template, fallbackStrategy);
    const strategy = strategyResult.data;
    await fs.writeFile(account.profilePath, strategy.agentsMdContent, "utf8");

    await prisma.accountStrategy.create({
      data: {
        accountId: account.id,
        positioning: strategy.positioning,
        strategyJson: strategy.strategyJson,
        markdown: strategy.markdown,
        agentsMdContent: strategy.agentsMdContent,
        execGuide: strategy.execGuide
      }
    });

    await prisma.accountProfile.create({
      data: {
        accountId: account.id,
        path: account.profilePath,
        content: strategy.agentsMdContent,
        versions: JSON.stringify([{ version: 1, savedAt: new Date().toISOString(), content: strategy.agentsMdContent }])
      }
    });

    await prisma.systemLog.create({
      data: {
        accountId: account.id,
        level: strategyResult.usedLlm ? "info" : strategyResult.error ? "warn" : "info",
        message: strategyResult.usedLlm
          ? `使用 OpenAI API 生成账号策划与 AGENTS.md：${account.name}`
          : `使用内置模板生成账号策划与 AGENTS.md：${account.name}`,
        meta: JSON.stringify({ llm: strategyResult.usedLlm, error: strategyResult.usedLlm ? null : strategyResult.error || null })
      }
    });

    const full = await prisma.account.findUnique({
      where: { id: account.id },
      include: {
        strategy: true,
        profile: true,
        referenceResearches: { orderBy: { createdAt: "desc" }, take: 5 },
        imageStyleStudies: { orderBy: { createdAt: "desc" }, take: 5 },
        interactionPlans: { orderBy: { createdAt: "desc" }, take: 8 },
        postReviews: { orderBy: { createdAt: "desc" }, take: 8 },
        expertRules: { orderBy: { createdAt: "desc" }, take: 20 },
        industryKnowledgeResearches: { orderBy: { createdAt: "desc" }, take: 5 },
        assets: true,
        weeklyPlans: { include: { noteTasks: true } }
      }
    });

    return NextResponse.json(full);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
