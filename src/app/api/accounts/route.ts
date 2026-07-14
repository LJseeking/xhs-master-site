import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ensureAccountDirs } from "@/lib/fsPaths";
import { buildAccountStrategy } from "@/lib/strategy";
import { generateStrategyWithLlm } from "@/lib/llm";
import { accountTypeTemplates } from "@/data/accountTypeTemplates";

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

export async function GET() {
  const templateOrder = new Map(accountTypeTemplates.map((template, index) => [template.typeKey, index]));
  const [accounts, templates] = await Promise.all([
    prisma.account.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        strategy: true,
        profile: true,
        referenceResearches: { orderBy: { createdAt: "desc" }, take: 5 },
        imageStyleStudies: { orderBy: { createdAt: "desc" }, take: 5 },
        interactionPlans: { orderBy: { createdAt: "desc" }, take: 8 },
        postReviews: { orderBy: { createdAt: "desc" }, take: 8 },
        expertRules: { orderBy: { createdAt: "desc" }, take: 20 },
        industryKnowledgeResearches: { orderBy: { createdAt: "desc" }, take: 5 },
        assets: { orderBy: { createdAt: "desc" }, take: 50 },
        weeklyPlans: { orderBy: { createdAt: "desc" }, include: { noteTasks: true }, take: 10 }
      }
    }),
    prisma.accountTypeTemplate.findMany({ orderBy: { id: "asc" } })
  ]);
  const sortedTemplates = [...templates].sort(
    (a, b) => (templateOrder.get(a.typeKey) ?? 999) - (templateOrder.get(b.typeKey) ?? 999)
  );
  return NextResponse.json({ accounts, templates: sortedTemplates });
}

export async function POST(request: Request) {
  const body = accountSchema.parse(await request.json());
  const dirs = await ensureAccountDirs(body.name);
  const template = await prisma.accountTypeTemplate.findUnique({ where: { typeKey: body.accountType } });

  if (!template) {
    return NextResponse.json({ error: "未知账号类型，请先运行 npm run db:init 初始化模板。" }, { status: 400 });
  }

  const account = await prisma.account.create({
    data: {
      ...body,
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
}
