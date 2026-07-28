import type { Account, AccountStrategy, AccountTypeTemplate, Asset, NoteTask, WeeklyPlan } from "@/types/domain";
import { getBackendApiBaseUrl } from "@/lib/backendApi";
import { completeWithBackendAi } from "@/lib/backendAiClient";
import type { StrategyBundle } from "@/lib/strategy";
import { fallbackReferenceSummary } from "@/lib/referenceResearch";
import { fallbackInteractionSummary } from "@/lib/interactionPrompts";
import { summarizeImageStyleStudyFallback } from "@/lib/imageStyleStudy";
import type { RecentWeeklyTopicGroup } from "@/lib/weeklyTopicHistory";

type LlmResult<T> =
  | { usedLlm: true; data: T; model: string }
  | { usedLlm: false; data: T; error?: string };

type NoteTaskSeed = {
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

export function getLlmStatus() {
  return {
    enabled: true,
    model: process.env.AI_MODEL || "gpt-5.5",
    baseUrl: `${getBackendApiBaseUrl()}/ai/v1/complete`
  };
}

export async function generateStrategyWithLlm(
  account: Account,
  template: AccountTypeTemplate,
  fallback: StrategyBundle
): Promise<LlmResult<StrategyBundle>> {
  const status = getLlmStatus();
  if (!status.enabled) return { usedLlm: false, data: fallback, error: "AI 未启用，已使用内置模板生成。" };

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
    account,
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

  const response = await createTextResponse({
    instructions: "你是资深小红书内容运营策略师和自动化工作流编排专家。输出必须安全、具体、可执行，并严格遵守 Prompt + Command only 模式。",
    input: prompt
  });

  if (!response.ok) return { usedLlm: false, data: fallback, error: response.error };

  const parsed = extractJson(response.text);
  if (!parsed || typeof parsed !== "object") {
    return { usedLlm: false, data: fallback, error: "大模型返回内容不是可解析 JSON，已使用内置模板。" };
  }

  const positioning = readString(parsed, "positioning") || fallback.positioning;
  const markdown = readString(parsed, "markdown") || fallback.markdown;
  const agentsMdContent = readString(parsed, "agentsMdContent") || fallback.agentsMdContent;
  const execGuide = readString(parsed, "execGuide") || fallback.execGuide;
  const strategyJson = JSON.stringify(readObject(parsed, "strategy") || safeJson(fallback.strategyJson), null, 2);

  return {
    usedLlm: true,
    model: status.model,
    data: {
      positioning,
      strategyJson,
      markdown,
      agentsMdContent,
      execGuide
    }
  };
}

export async function regenerateStrategyFromReferenceResearchWithLlm(input: {
  account: Account;
  template: AccountTypeTemplate;
  referenceSummary: {
    summaryMarkdown: string;
    contentFeatures: string;
    personaInsights: string;
    strategyInsights: string;
    rawResults: string;
    selectedAccounts: string;
  };
  fallback: StrategyBundle;
}): Promise<LlmResult<StrategyBundle>> {
  const status = getLlmStatus();
  if (!status.enabled) {
      return { usedLlm: false, data: input.fallback, error: "AI 未启用，暂时无法基于参考账号研究重生成策划案与 AGENTS.md。" };
  }

  const prompt = `请严格基于“参考账号研究结果”重生成小红书账号策划案和 AGENTS.md。

这是一个必须借助 AI 重生成的步骤。请不要只复述模板；要把参考账号研究中的作者定位、栏目、标题、正文、图片风格、互动引导、用户痛点和差异化机会转化为我方账号的人设和运营策略。

硬性要求：
- 当前产品模式是 Prompt + Command only，不允许真实发布、评论、点赞、收藏、关注或私信。
- 不得抄袭参考账号，不得把参考账号素材/经历伪装成我方真实体验。
- 必须写出“借鉴什么”和“如何避免同质化”。
- 必须生成完整策划案 Markdown 和可直接保存为 profiles/<账号名>/AGENTS.md 的内容。
- 只返回 JSON，不要 Markdown 代码块。

我方账号：
${JSON.stringify(input.account, null, 2)}

账号类型模板：
${JSON.stringify(input.template, null, 2)}

参考账号研究总结：
${JSON.stringify(input.referenceSummary, null, 2)}

内置模板兜底稿，仅供结构参考，不可机械照抄：
${JSON.stringify(input.fallback, null, 2)}

JSON 字段：
{
  "positioning": "基于参考账号研究后的账号一句话定位",
  "strategy": {
    "referenceAccountsUsed": ["参考账号/账号类型/内容特色"],
    "borrowedPatterns": ["可借鉴的栏目、标题、封面、互动模式"],
    "differentiationRules": ["避免同质化的具体规则"],
    "persona": {},
    "contentColumns": [],
    "titleRules": [],
    "coverRules": [],
    "growthRules": [],
    "commercializationRules": [],
    "xhsAutoOpRules": []
  },
  "markdown": "# 完整策划方案 Markdown",
  "agentsMdContent": "# AGENTS.md Markdown",
  "execGuide": "给 xiaohongshu_auto_op 的执行说明"
}`;

  const response = await createTextResponse({
    instructions: "你是资深小红书竞品研究、账号定位和内容运营策略专家。你必须把参考账号研究转化为差异化人设、栏目、标题、封面、互动和商业化策略，并严格遵守 Prompt + Command only 安全边界。",
    input: prompt
  });

  if (!response.ok) return { usedLlm: false, data: input.fallback, error: response.error };

  const parsed = extractJson(response.text);
  if (!parsed || typeof parsed !== "object") {
    return { usedLlm: false, data: input.fallback, error: "AI 返回内容不是可解析 JSON，未重生成策划案。" };
  }

  return {
    usedLlm: true,
    model: status.model,
    data: {
      positioning: readString(parsed, "positioning") || input.fallback.positioning,
      strategyJson: JSON.stringify(readObject(parsed, "strategy") || safeJson(input.fallback.strategyJson), null, 2),
      markdown: readString(parsed, "markdown") || input.fallback.markdown,
      agentsMdContent: readString(parsed, "agentsMdContent") || input.fallback.agentsMdContent,
      execGuide: readString(parsed, "execGuide") || input.fallback.execGuide
    }
  };
}

export async function generateWeeklyTasksWithLlm(input: {
  account: Account;
  strategy: AccountStrategy | null;
  assets: Asset[];
  weeklyPlan: WeeklyPlan;
  weeklyInput: WeeklyPlanInput;
  fallbackTasks: NoteTaskSeed[];
}): Promise<LlmResult<NoteTaskSeed[]>> {
  const status = getLlmStatus();
  if (!status.enabled) return { usedLlm: false, data: input.fallbackTasks, error: "AI 未启用，已使用内置模板生成。" };

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
  const dedupRequirements = recentTopicGroups.length
    ? `
- “最近两周历史主题”只用于排除重复，不是选题示例；不要复用或改写这些标题。
- 新任务的 topicTitle 不得与历史主题完全相同，也不得只是同一具体主题的近义改写、语序调整或标题包装。
- 内容栏目和内容类型可以重复，但具体对象、问题、场景或切入角度必须明显不同；同一大方向需要改用进阶、对比、细分场景或不同用户问题。`
    : "";
  const prompt = `请根据账号策略、本周目标和素材情况，生成一周小红书 note_tasks。

要求：
- 生成 ${input.fallbackTasks.length} 篇。
- 必须优先阅读并遵循输入中的完整 strategy；账号定位、人设、目标用户、内容栏目、标题封面策略、商业化路径和风险边界都应以 strategy 为主要依据，不能只依据账号类型套用通用模板。
- 如果 weeklyInput.weeklyFocus 非空，它代表用户主动指定的本周重点，应作为本周选题的最高优先级；围绕该重点拆分具体且不重复的任务，同时不得违背 strategy 中的真实性和风险边界。
- 如果 weeklyInput.weeklyFocus 为空，则以完整 strategy 和本周运营目标为主要依据生成选题。
- 当前执行模式是只生成计划、Prompt 和命令建议，不允许真实发布或互动。
- 每篇任务必须具体到用户痛点、核心观点、正文结构、图片要求、评论区钩子。
- bodyStructure 只能描述面向目标读者的内容推进方式，必须使用可直接转化为发布正文的读者视角表达；不得写成运营分析、素材评估或创作说明。
- bodyStructure 不得出现“素材观察”“用于测试”“本篇承担”“不能当攻略”“需要补齐资料”等内部策划话术，也不得使用含义相同的改写。
- 信息不足只用于约束不能编造的事实，不得把“缺少资料”“参数不全”“不能作为完整攻略”等说明设计成正文开头；需要提醒时，转换成面向读者的自然行动建议，例如“出发前建议确认……”。
- 推荐素材只能来自输入素材或明确写“素材缺口”，禁止伪造真实素材。
- 只返回 JSON，不要 Markdown 代码块。${dedupRequirements}

输入：
${JSON.stringify(
  {
    account: accountContext,
    strategy: input.strategy,
    assets: input.assets.map((asset) => ({
      filePath: asset.filePath,
      fileType: asset.fileType,
      sourceType: asset.sourceType,
      tags: asset.tags,
      suitableTypes: asset.suitableTypes,
      coverReady: asset.coverReady,
      riskNotes: asset.riskNotes
    })),
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

  const response = await createTextResponse({
    instructions: "你是小红书周运营计划专家，擅长把账号定位、素材条件和测试假设拆成可执行 note_tasks。",
    input: prompt
  });

  if (!response.ok) return { usedLlm: false, data: input.fallbackTasks, error: response.error };

  const parsed = extractJson(response.text);
  const rawTasks = parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>).tasks)
    ? ((parsed as Record<string, unknown>).tasks as Array<Record<string, unknown>>)
    : [];

  if (!rawTasks.length) {
    return { usedLlm: false, data: input.fallbackTasks, error: "大模型未返回 tasks 数组，已使用内置模板。" };
  }

  const tasks = rawTasks.slice(0, input.fallbackTasks.length).map((task, index) => {
    const fallback = input.fallbackTasks[index] ?? input.fallbackTasks[0];
    return {
      accountId: input.account.id,
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

  return { usedLlm: true, model: status.model, data: tasks };
}

export async function summarizeReferenceResearchWithLlm(input: {
  account: Account;
  template: AccountTypeTemplate;
  rawResults: string;
  selectedAccounts: string;
}): Promise<LlmResult<{ summaryMarkdown: string; contentFeatures: string; personaInsights: string; strategyInsights: string }>> {
  const fallback = fallbackReferenceSummary(input.rawResults);
  const status = getLlmStatus();
  if (!status.enabled) return { usedLlm: false, data: fallback, error: "AI 未启用，已保存原始结果并使用占位总结。" };

  const prompt = `请总结 xiaohongshu_auto_op 返回的同类型参考账号研究结果，并给出我方账号策划建议。

要求：
- 只分析，不执行任何真实账号操作。
- 不得把参考账号内容、素材、经历伪装成我方原创真实体验。
- 输出必须服务于生成我方账号的人设文件和策划案。
- 必须优先提炼全国同类型爆款/高互动样本的规律；账号所在城市或本地样本只作为落地差异补充，不能让整体风格和内容策略被本地样本局限。
- 必须保留研究报告中的爆款帖子作者信息、关注数、作者定位和图片风格分析。
- 不得补造、推测或要求评论区结论；本次研究不使用评论数据。
- 只返回 JSON，不要 Markdown 代码块。

我方账号：
${JSON.stringify({ account: input.account, template: input.template }, null, 2)}

用户手动标记/补充的参考账号：
${input.selectedAccounts || "无"}

xiaohongshu_auto_op 返回结果：
${input.rawResults}

JSON 字段：
{
  "summaryMarkdown": "# 参考账号研究总结 Markdown，包含候选爆款帖子、作者研究、标题正文、图片风格、互动引导、可借鉴点、差异化机会、风险",
  "contentFeatures": "爆款帖标题正文、作者定位、图片风格和互动引导总结",
  "personaInsights": "对我方账号人设设定的建议",
  "strategyInsights": "对我方内容栏目、标题、封面、增长、商业化路径的建议"
}`;

  const response = await createTextResponse({
    instructions: "你是小红书竞品研究与账号定位专家，擅长把参考账号研究转成差异化人设和内容策略。",
    input: prompt
  });

  if (!response.ok) return { usedLlm: false, data: fallback, error: response.error };
  const parsed = extractJson(response.text);
  if (!parsed) return { usedLlm: false, data: fallback, error: "大模型返回内容不是可解析 JSON，已使用占位总结。" };

  return {
    usedLlm: true,
    model: status.model,
    data: {
      summaryMarkdown: readString(parsed, "summaryMarkdown") || fallback.summaryMarkdown,
      contentFeatures: readString(parsed, "contentFeatures") || fallback.contentFeatures,
      personaInsights: readString(parsed, "personaInsights") || fallback.personaInsights,
      strategyInsights: readString(parsed, "strategyInsights") || fallback.strategyInsights
    }
  };
}

export async function summarizeInteractionCandidatesWithLlm(input: {
  account: Account;
  strategy: AccountStrategy | null;
  noteTask: NoteTask | null;
  rawResults: string;
  discoveryPrompt: string;
  commentPrompt: string;
}): Promise<LlmResult<{ targetUsersMarkdown: string; commentDraftsMarkdown: string }>> {
  const fallback = fallbackInteractionSummary(input.rawResults);
  const status = getLlmStatus();
  if (!status.enabled) return { usedLlm: false, data: fallback, error: "AI 未启用，已保存原始结果并使用人工整理框架。" };

  const prompt = `请分析 xiaohongshu_auto_op 返回的目标用户搜索结果，并生成评论互动策略。

要求：
- 当前产品模式是 Prompt + Command only，只生成策略、草稿和命令建议。
- 不允许真实评论、回复、点赞、收藏、关注或私信。
- 核心目标是筛选可能对我方账号和当前笔记感兴趣的用户。
- 评论草稿必须基于候选用户/评论上下文，不得硬广、不得诱导私信、不得复制刷屏。
- 如果候选信息不足，必须标明需要人工补充，不要编造用户。
- 只返回 JSON，不要 Markdown 代码块。

我方账号：
${JSON.stringify(
  {
    account: input.account,
    strategy: input.strategy
      ? {
          positioning: input.strategy.positioning,
          execGuide: input.strategy.execGuide
        }
      : null,
    noteTask: input.noteTask
  },
  null,
  2
)}

找人 Prompt：
${input.discoveryPrompt}

评论策略 Prompt：
${input.commentPrompt}

xiaohongshu_auto_op 返回结果：
${input.rawResults}

JSON 字段：
{
  "targetUsersMarkdown": "# 目标用户搜索总结 Markdown，包含候选笔记、候选用户、兴趣信号、意向分层、排除对象、人工确认项",
  "commentDraftsMarkdown": "# 评论互动策略 Markdown，包含评论原则、分层策略、12-20 条评论草稿、审核清单、xhs-interact 参数建议"
}`;

  const response = await createTextResponse({
    instructions: "你是小红书社区互动策略专家，擅长从搜索结果和评论区里筛选潜在兴趣用户，并生成克制、真诚、有帮助的评论草稿。你必须严格遵守只生成 Prompt 和命令建议的安全模式。",
    input: prompt
  });

  if (!response.ok) return { usedLlm: false, data: fallback, error: response.error };
  const parsed = extractJson(response.text);
  if (!parsed) return { usedLlm: false, data: fallback, error: "大模型返回内容不是可解析 JSON，已使用人工整理框架。" };

  return {
    usedLlm: true,
    model: status.model,
    data: {
      targetUsersMarkdown: readString(parsed, "targetUsersMarkdown") || fallback.targetUsersMarkdown,
      commentDraftsMarkdown: readString(parsed, "commentDraftsMarkdown") || fallback.commentDraftsMarkdown
    }
  };
}

export async function summarizeImageStyleStudyWithLlm(input: {
  account: Account;
  rawResults: string;
  researchPrompt: string;
}): Promise<LlmResult<{ summaryMarkdown: string; styleBrief: string[] }>> {
  const fallback = summarizeImageStyleStudyFallback(input.account, input.rawResults);
  const status = getLlmStatus();
  if (!status.enabled) return { usedLlm: false, data: fallback, error: "AI 未启用，已使用整理规则生成图片风格摘要。" };

  const prompt = `请总结 xiaohongshu_auto_op 返回的小红书图片风格研究结果。

要求：
- 只分析图片风格，不要重写账号策划案，不要总结互动和商业化。
- 输出要服务于后续 image2 图片 Prompt。
- 不得建议伪造真实拍摄、真实经历、真实授权。
- 必须把长研究压缩为可复用的图片风格原则。
- 只返回 JSON，不要 Markdown 代码块。

我方账号：
${JSON.stringify(input.account, null, 2)}

原始图片研究 Prompt：
${input.researchPrompt}

xiaohongshu_auto_op 返回结果：
${input.rawResults}

JSON 字段：
{
  "summaryMarkdown": "# 图片风格研究摘要 Markdown，包含封面共性、4 张图默认结构、真实感来源、收藏点、风险边界、我方建议",
  "styleBrief": ["可放入单篇图片 Prompt 的短原则，4-6 条，每条不超过 40 字"]
}`;

  const response = await createTextResponse({
    instructions: "你是小红书图片风格研究专家，擅长把竞品图片观察压缩成可执行的 image2 提示词原则。输出必须克制、真实、安全。",
    input: prompt
  });

  if (!response.ok) return { usedLlm: false, data: fallback, error: response.error };
  const parsed = extractJson(response.text);
  if (!parsed) return { usedLlm: false, data: fallback, error: "大模型返回内容不是可解析 JSON，已使用本地规则整理图片风格摘要。" };
  const rawBrief = Array.isArray(parsed.styleBrief) ? parsed.styleBrief : [];
  const styleBrief = rawBrief
    .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    .map((item) => item.trim())
    .slice(0, 8);

  return {
    usedLlm: true,
    model: status.model,
    data: {
      summaryMarkdown: readString(parsed, "summaryMarkdown") || fallback.summaryMarkdown,
      styleBrief: styleBrief.length ? styleBrief : fallback.styleBrief
    }
  };
}

async function createTextResponse(input: { instructions: string; input: string }): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const status = getLlmStatus();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("backend ai timeout"), 11 * 60 * 1000);

  try {
    const response = await completeWithBackendAi({
      model: status.model,
      instructions: input.instructions,
      input: input.input,
      signal: controller.signal
    });

    if (!response.ok) return { ok: false, error: response.error };
    return { ok: true, text: response.text };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "AI 调用失败。" };
  } finally {
    clearTimeout(timeout);
  }
}

function extractJson(text: string): Record<string, unknown> | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const raw = fenced || text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readString(source: Record<string, unknown>, key: string) {
  return typeof source[key] === "string" ? source[key] : "";
}

function readObject(source: Record<string, unknown>, key: string) {
  return source[key] && typeof source[key] === "object" && !Array.isArray(source[key])
    ? (source[key] as Record<string, unknown>)
    : null;
}

function safeJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function stringFrom(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
