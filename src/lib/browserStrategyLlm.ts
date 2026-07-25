import { accountTypeTemplates, getTemplateByKey } from "@/data/accountTypeTemplates";
import { completeWithBackendAi } from "@/lib/backendAiClient";
import { buildAccountStrategy } from "@/lib/strategy";
import type { RecentWeeklyTopicGroup } from "@/lib/weeklyTopicHistory";

type ClientAccountInput = {
  id?: number;
  name: string;
  accountParam: string;
  accountType: string;
  stage: string;
  personaBase: string;
  city: string;
  targetUsers: string;
  painPoints: string;
  contentDirections: string;
  businessGoals: string;
  monetization: string;
  referenceAccounts: string;
  materialCondition: string;
  taboos: string;
  profilePath: string;
  assetsPath: string;
};

type StrategyResponse = {
  positioning: string;
  strategyJson: string;
  markdown: string;
  agentsMdContent: string;
  execGuide: string;
};

type WeeklyTaskSeed = {
  accountId: number;
  weeklyPlanId: number;
  publishAt: string;
  contentType: string;
  contentGoal: string;
  topicTitle: string;
  targetUser: string;
  painPoint: string;
  coreView: string;
  bodyStructure: string;
  requiredImages: string;
  recommendedAssets: string;
  coverCopyDirection: string;
  commentHook: string;
  expectedGoal: string;
  status: string;
};

type WeeklyPlanInput = {
  theme: string;
  goal: string;
  frequency: number;
  ratio: string;
  testHypothesis: string;
  commercializationMove: string;
  interactionGoal: string;
  availableAssets: string;
  taboos: string;
  weeklyFocus?: string;
  recentTopicGroups?: RecentWeeklyTopicGroup[];
};

function getBrowserLlmStatus() {
  return {
    enabled: true,
    model: process.env.AI_MODEL || "gpt-5.5",
    baseUrl: "ai/v1/complete"
  };
}

function extractJson(text: string) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function readString(obj: unknown, key: string) {
  if (!obj || typeof obj !== "object") return "";
  const value = (obj as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function readObject(obj: unknown, key: string) {
  if (!obj || typeof obj !== "object") return null;
  const value = (obj as Record<string, unknown>)[key];
  return value && typeof value === "object" ? value : null;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function stringFrom(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function extractText(json: unknown) {
  if (!json || typeof json !== "object") return "";
  const record = json as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;
  const output = Array.isArray(record.output) ? record.output : [];
  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as Record<string, unknown>).content;
      return Array.isArray(content) ? content : [];
    })
    .map((part) => {
      if (!part || typeof part !== "object") return "";
      const item = part as Record<string, unknown>;
      return typeof item.text === "string" ? item.text : "";
    })
    .filter(Boolean)
    .join("\n");
}

function extractChatCompletionText(json: unknown) {
  if (!json || typeof json !== "object") return "";
  const choices = (json as Record<string, unknown>).choices;
  if (!Array.isArray(choices)) return "";
  return choices
    .map((choice) => {
      if (!choice || typeof choice !== "object") return "";
      const message = (choice as Record<string, unknown>).message;
      if (!message || typeof message !== "object") return "";
      const content = (message as Record<string, unknown>).content;
      return typeof content === "string" ? content : "";
    })
    .filter(Boolean)
    .join("\n");
}

function looksLikeUnsupportedResponses(text: string) {
  const lower = text.toLowerCase();
  return (
    lower.includes("not found") ||
    lower.includes("404") ||
    lower.includes("unsupported") ||
    lower.includes("unknown") ||
    lower.includes("invalid url") ||
    lower.includes("no route") ||
    lower.includes("route")
  );
}

async function createTextResponse(input: { instructions: string; input: string }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort("AI request timeout"), 11 * 60 * 1000);

  try {
    const response = await completeWithBackendAi({
      instructions: input.instructions,
      input: input.input,
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(response.error);
    }
    return response.text;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateStrategyWithBrowserLlm(account: ClientAccountInput): Promise<{
  usedLlm: boolean;
  error?: string;
  data: StrategyResponse;
}> {
  const templateSeed = getTemplateByKey(account.accountType) ?? accountTypeTemplates[0];
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

  const accountRecord = {
    ...account,
    id: account.id || 0,
    createdAt: new Date(0),
    updatedAt: new Date(0)
  };

  const fallback = buildAccountStrategy(accountRecord as never, template as never);
  const status = getBrowserLlmStatus();
  if (!status.enabled) {
    return { usedLlm: false, data: fallback, error: "AI 未启用，已使用内置模板生成。" };
  }

  const prompt = `请为一个小红书账号生成完整运营策划案和 AGENTS.md。

要求：
- 当前产品模式是 Prompt + Command only，不允许真实发布、评论、点赞、收藏、私信。
- 如果 account.referenceAccounts 中包含参考账号研究洞察，必须优先用于人设、差异化定位、栏目、标题、封面和商业化策略。
- 必须保留 xiaohongshu_auto_op 的执行边界：真实账号操作只输出命令建议，人工确认。
- 不伪造真实体验、真实授权、真实探店、真实亲历、真实轨迹或真实交易。
- 以中文输出。
- 只返回 JSON，不要 Markdown 代码块。

账号信息：
${JSON.stringify(
    {
      account: accountRecord,
      accountTypeTemplate: template,
      requiredSections: [
        "账号一句话定位",
        "账号类型判断",
        "人设设定",
        "用户画像",
        "用户痛点",
        "差异化定位",
        "内容主线",
        "内容栏目",
        "选题方向",
        "图片与素材策略",
        "标题策略",
        "封面策略",
        "互动策略",
        "增长策略",
        "商业化路径",
        "30 天启动计划",
        "一周内容模板",
        "风险与禁区",
        "AGENTS.md 内容",
        "给 xiaohongshu_auto_op 的执行说明"
      ],
      fallback
    },
    null,
    2
  )}

JSON 字段：
{
  "positioning": "账号一句话定位",
  "strategy": { "可结构化保存的账号策略对象": true },
  "markdown": "# 完整策划方案 Markdown",
  "agentsMdContent": "# AGENTS.md Markdown",
  "execGuide": "给 xiaohongshu_auto_op 的执行说明"
}`;

  try {
    const text = await createTextResponse({
      instructions: "你是资深小红书内容运营策略师和自动化工作流编排专家。输出必须安全、具体、可执行，并严格遵守 Prompt + Command only 模式。",
      input: prompt
    });

    const parsed = extractJson(text);
    if (!parsed || typeof parsed !== "object") {
      return { usedLlm: false, data: fallback, error: "大模型返回内容不是可解析 JSON，已使用内置模板。" };
    }

    return {
      usedLlm: true,
      data: {
        positioning: readString(parsed, "positioning") || fallback.positioning,
        strategyJson: JSON.stringify(readObject(parsed, "strategy") || safeJson(fallback.strategyJson), null, 2),
        markdown: readString(parsed, "markdown") || fallback.markdown,
        agentsMdContent: readString(parsed, "agentsMdContent") || fallback.agentsMdContent,
        execGuide: readString(parsed, "execGuide") || fallback.execGuide
      }
    };
  } catch (error) {
    return {
      usedLlm: false,
      data: fallback,
      error: error instanceof Error ? error.message : "浏览器端 AI 调用失败。"
    };
  }
}

export async function generateWeeklyTasksWithBrowserLlm(input: {
  account: ClientAccountInput & { strategy?: unknown | null; assets?: unknown[] };
  strategy: unknown | null;
  assets: unknown[];
  weeklyPlan: { id: number };
  weeklyInput: WeeklyPlanInput;
  fallbackTasks: WeeklyTaskSeed[];
}): Promise<{
  usedLlm: boolean;
  error?: string;
  data: WeeklyTaskSeed[];
}> {
  const status = getBrowserLlmStatus();
  if (!status.enabled) {
    return { usedLlm: false, data: input.fallbackTasks, error: "AI 未启用，已使用内置模板生成。" };
  }

  const recentTopicGroups = input.weeklyInput.recentTopicGroups || [];
  const weeklyInputContext = {
    theme: input.weeklyInput.theme,
    goal: input.weeklyInput.goal,
    frequency: input.weeklyInput.frequency,
    ratio: input.weeklyInput.ratio,
    testHypothesis: input.weeklyInput.testHypothesis,
    commercializationMove: input.weeklyInput.commercializationMove,
    interactionGoal: input.weeklyInput.interactionGoal,
    availableAssets: input.weeklyInput.availableAssets,
    taboos: input.weeklyInput.taboos,
    weeklyFocus: input.weeklyInput.weeklyFocus
  };
  const dedupRequirements = recentTopicGroups.length
    ? `
- “最近两周历史主题”只用于排除重复，不是选题示例；不要复用或改写这些标题。
- 新任务的 topicTitle 不得与历史主题完全相同，也不得只是同一具体主题的近义改写、语序调整或标题包装。
- 内容栏目和内容类型可以重复，但具体对象、问题、场景或切入角度必须明显不同；同一大方向需要改用进阶、对比、细分场景或不同用户问题。`
    : "";
  const accountContext = {
    id: input.account.id,
    name: input.account.name,
    accountParam: input.account.accountParam,
    accountType: input.account.accountType,
    stage: input.account.stage,
    personaBase: input.account.personaBase,
    city: input.account.city,
    targetUsers: input.account.targetUsers,
    painPoints: input.account.painPoints,
    contentDirections: input.account.contentDirections,
    businessGoals: input.account.businessGoals,
    monetization: input.account.monetization,
    referenceAccounts: input.account.referenceAccounts,
    materialCondition: input.account.materialCondition,
    taboos: input.account.taboos,
    profilePath: input.account.profilePath,
    assetsPath: input.account.assetsPath
  };
  const prompt = `请根据账号策略、本周目标和素材情况，生成一周小红书 note_tasks。

要求：
- 生成 ${input.fallbackTasks.length} 篇。
- 必须优先阅读并遵循输入中的完整 strategy；账号定位、人设、目标用户、内容栏目、标题封面策略、商业化路径和风险边界都应以 strategy 为主要依据，不能只依据账号类型套用通用模板。
- 如果 weeklyInput.weeklyFocus 非空，它代表用户主动指定的本周重点，应作为本周选题的最高优先级；围绕该重点拆分具体且不重复的任务，同时不得违背 strategy 中的真实性和风险边界。
- 如果 weeklyInput.weeklyFocus 为空，则以完整 strategy 和本周运营目标为主要依据生成选题。
- 当前执行模式是只生成计划、Prompt 和命令建议，不允许真实发布或互动。
- 每篇任务必须具体到用户痛点、核心观点、正文结构、图片要求、评论区钩子。
- 推荐素材只能来自输入素材或明确写“素材缺口”，禁止伪造真实素材。
- 只返回 JSON，不要 Markdown 代码块。${dedupRequirements}

输入：
${JSON.stringify(
    {
      account: accountContext,
      strategy: input.strategy,
      assets: input.assets,
      weeklyPlan: input.weeklyPlan,
      weeklyInput: weeklyInputContext,
      recentTwoWeeksTopics: recentTopicGroups
    },
    null,
    2
  )}

JSON 字段：
{
  "tasks": [
    {
      "publishAt": "YYYY-MM-DD HH:mm",
      "contentType": "图文笔记/视频脚本/教程清单等",
      "contentGoal": "",
      "topicTitle": "",
      "targetUser": "",
      "painPoint": "",
      "coreView": "",
      "bodyStructure": "",
      "requiredImages": "",
      "recommendedAssets": "",
      "coverCopyDirection": "",
      "commentHook": "",
      "expectedGoal": "",
      "status": "待生成Prompt"
    }
  ]
}`;

  try {
    const text = await createTextResponse({
      instructions: "你是小红书周运营计划专家，擅长把账号定位、素材条件和测试假设拆成可执行 note_tasks。",
      input: prompt
    });
    const parsed = extractJson(text);
    const rawTasks = parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>).tasks)
      ? ((parsed as Record<string, unknown>).tasks as Array<Record<string, unknown>>)
      : [];

    if (!rawTasks.length) {
      return { usedLlm: false, data: input.fallbackTasks, error: "大模型未返回 tasks 数组，已使用内置模板。" };
    }

    const tasks = rawTasks.slice(0, input.fallbackTasks.length).map((task, index) => {
      const fallback = input.fallbackTasks[index] ?? input.fallbackTasks[0];
      return {
        accountId: input.account.id || fallback.accountId,
        weeklyPlanId: input.weeklyPlan.id,
        publishAt: stringFrom(task.publishAt, fallback.publishAt),
        contentType: stringFrom(task.contentType, fallback.contentType),
        contentGoal: stringFrom(task.contentGoal, fallback.contentGoal),
        topicTitle: stringFrom(task.topicTitle, fallback.topicTitle),
        targetUser: stringFrom(task.targetUser, fallback.targetUser),
        painPoint: stringFrom(task.painPoint, fallback.painPoint),
        coreView: stringFrom(task.coreView, fallback.coreView),
        bodyStructure: stringFrom(task.bodyStructure, fallback.bodyStructure),
        requiredImages: stringFrom(task.requiredImages, fallback.requiredImages),
        recommendedAssets: stringFrom(task.recommendedAssets, fallback.recommendedAssets),
        coverCopyDirection: stringFrom(task.coverCopyDirection, fallback.coverCopyDirection),
        commentHook: stringFrom(task.commentHook, fallback.commentHook),
        expectedGoal: stringFrom(task.expectedGoal, fallback.expectedGoal),
        status: "待生成Prompt"
      };
    });

    return { usedLlm: true, data: tasks };
  } catch (error) {
    return {
      usedLlm: false,
      data: input.fallbackTasks,
      error: error instanceof Error ? error.message : "浏览器端一周计划生成失败。"
    };
  }
}
