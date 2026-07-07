import type { Account, AccountStrategy, NoteTask } from "@prisma/client";
import { accountVisualMode } from "@/lib/imagePrompts";

type CommandSuggestion = {
  category: string;
  command: string;
  description: string;
  safetyNote: string;
};

function q(value: string) {
  return JSON.stringify(value);
}

function firstPieces(value: string, max = 4) {
  return value
    .split(/[，,、；;\n/]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

function compactText(value: string, fallback: string, max = 90) {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function compactList(value: string, fallback: string, maxItems = 3, itemMax = 34) {
  const items = firstPieces(value, maxItems);
  return items.length ? items.map((item) => compactText(item, item, itemMax)).join("；") : fallback;
}

function buildAccountSummary(account: Account, strategy?: AccountStrategy | null) {
  const positioning = compactText(strategy?.positioning || "", "", 110);
  return [
    `账号：${account.name} / ${account.accountParam}`,
    `定位：${positioning || compactList(account.contentDirections, account.accountType, 2)}`,
    `目标用户：${compactList(account.targetUsers, "待根据搜索结果判断", 2)}`,
    `语气：${compactText(account.personaBase, "真诚、克制、有帮助", 64)}`,
    `禁区：${compactList(account.taboos, "不硬广；不诱导私信；不伪造体验；不承诺效果", 3, 36)}`
  ].join("\n- ");
}

function buildNoteSummary(noteTask?: NoteTask | null) {
  if (!noteTask) return "未绑定具体笔记，以账号整体目标用户为准。";
  return [
    `标题：${noteTask.topicTitle}`,
    `目标用户：${compactText(noteTask.targetUser, "未设置", 70)}`,
    `痛点：${compactText(noteTask.painPoint, "未设置", 90)}`,
    `观点：${compactText(noteTask.coreView, "未设置", 100)}`,
    `评论钩子：${compactText(noteTask.commentHook, "未设置", 80)}`
  ].join("\n- ");
}

function accountTypeSeeds(accountType: string) {
  const presets: Record<string, string[]> = {
    culture_tourism: ["周末去哪", "景区攻略", "文旅活动", "古镇街区", "亲子出游", "交通票务", "拍照机位", "避坑"],
    heritage: ["非遗体验", "民俗活动", "传统手作", "亲子研学", "传承人", "节庆活动", "体验预约", "文化旅游"],
    stay: ["民宿推荐", "周边游", "亲子酒店", "露营地", "宠物友好", "房型价格", "周末度假", "预订咨询"],
    food: ["探店", "求推荐餐厅", "不知道吃什么", "聚餐餐厅", "约会餐厅", "团购套餐", "包间预约"],
    outdoor: ["徒步路线", "周末徒步", "新手徒步", "路线攻略", "轨迹", "装备清单", "避坑"],
    museum: ["博物馆", "展览推荐", "亲子研学", "观展攻略", "预约票务", "展品故事", "周末看展"],
    product: ["特产推荐", "伴手礼", "文创礼物", "地域产品", "送礼", "产地故事", "规格价格", "怎么买"],
    service: ["本地服务", "门店推荐", "价格咨询", "预约", "服务流程", "案例", "避坑", "资质"]
  };
  return presets[accountVisualMode(accountType)] || presets.culture_tourism;
}

export function buildInteractionKeywords(account: Account, noteTask?: NoteTask | null) {
  const pieces = [
    ...accountTypeSeeds(account.accountType),
    account.city,
    ...firstPieces(account.targetUsers, 3),
    ...firstPieces(account.painPoints, 4),
    ...firstPieces(account.contentDirections, 3),
    noteTask?.topicTitle || "",
    noteTask?.painPoint || "",
    noteTask?.targetUser || ""
  ]
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(pieces)).slice(0, 10).join(" / ");
}

export function buildInteractionCommands(
  account: Account,
  noteTask?: NoteTask | null,
  options?: { publishedNoteUrl?: string; interactionGoal?: string }
): CommandSuggestion[] {
  const base = "uv run xiaohongshu_auto_op";
  const accountFlag = `--account ${q(account.accountParam)}`;
  const noteUrl = options?.publishedNoteUrl?.trim() || "粘贴已发布笔记 URL";
  const goal = options?.interactionGoal?.trim() || "围绕这篇已发布笔记，寻找可能感兴趣的用户并进行自然、有帮助的评论互动";

  return [
    {
      category: "基于已发布笔记的智能互动",
      command: `${base} xhs-content-ops engage --source-note-url ${q(noteUrl)} ${accountFlag} --goal ${q(goal)} --manual-confirm`,
      description: "把已发布笔记交给 xiaohongshu_auto_op，由 skill 自主寻找可能感兴趣的用户并规划互动。",
      safetyNote: "命令只作为建议展示；真实评论、点赞、收藏、私信等动作需要你在终端人工确认。"
    },
    {
      category: "互动前查看笔记详情",
      command: `${base} xhs-explore note-detail --note-url ${q(noteUrl)} ${accountFlag} --include-comments --limit 80`,
      description: "可选：先让 skill 读取这篇已发布笔记和评论区上下文。",
      safetyNote: "只读命令，不执行互动。"
    }
  ];
}

export function buildInteractionDiscoveryPrompt(input: {
  account: Account;
  strategy?: AccountStrategy | null;
  noteTask?: NoteTask | null;
  publishedNoteUrl?: string;
  interactionGoal?: string;
}) {
  const { account, strategy, noteTask, publishedNoteUrl, interactionGoal } = input;
  return `# 小红书已发布笔记互动任务

## 模式
由 xiaohongshu_auto_op 自主完成搜索、筛选和互动判断。localhost 只生成任务说明和命令建议，不直接执行真实账号操作。

## 账号参数
--account ${account.accountParam}

## 基准笔记
- 已发布笔记 URL：${publishedNoteUrl?.trim() || "请粘贴已发布笔记 URL"}
- 笔记摘要：
- ${buildNoteSummary(noteTask)}

## 互动目标
${interactionGoal?.trim() || "根据这篇已发布笔记，找到可能对该内容和账号感兴趣的用户，进行自然、有帮助、不打扰的评论互动。"}

## 账号上下文
- ${buildAccountSummary(account, strategy)}
- AGENTS.md：${account.profilePath}

## 执行要求
- 以这篇已发布笔记为起点，自主搜索可能感兴趣的笔记、评论区和用户。
- 优先互动：明确提问、求推荐、求避坑、表达相似需求、与账号目标用户匹配的人。
- 避免互动：营销号、搬运号、争议/隐私敏感、高风险承诺、明显反感打扰的人。
- 评论要具体回应上下文，不硬广，不诱导私信，不复制刷屏，不伪造亲身经历。
- 如果要执行真实评论/点赞/收藏/私信，先输出操作计划和具体内容，等待人工确认。`;
}

export function buildInteractionCommentPrompt(input: {
  account: Account;
  noteTask?: NoteTask | null;
  discoveryPrompt: string;
}) {
  return input.discoveryPrompt;
}

export function fallbackInteractionSummary(rawResults: string) {
  const excerpt = rawResults.slice(0, 2600);
  return {
    targetUsersMarkdown: `# 目标用户搜索结果待整理

已保存 xiaohongshu_auto_op 返回内容，但当前未完成大模型总结。

## 原始结果摘录
${excerpt || "暂无原始结果。"}

## 人工整理建议
- 标记评论里有明确问题的人。
- 优先筛选近期活跃、需求具体、和账号定位匹配的用户。
- 排除营销号、争议话题、隐私敏感和需要强承诺的问题。`,
    commentDraftsMarkdown: `# 评论互动草稿待生成

请补充可用的大模型 API 后重新生成，或按以下框架人工撰写：

1. 先回应对方的具体问题。
2. 给一个可验证的小建议。
3. 轻量提问，引导对方补充城市、预算、阶段或需求。
4. 不硬广、不诱导私信、不复制刷屏。`
  };
}
