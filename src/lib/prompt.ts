import type { Account, AccountStrategy, NoteTask, WeeklyPlan } from "@/types/domain";
import { accountVisualMode, isWeddingAccount, type AccountVisualMode } from "@/lib/imagePrompts";
import { resolveNoteContentStructure } from "@/lib/noteContentStructures";

type PromptAccount = Account & {
  referenceResearches?: Array<{
    contentFeatures?: string | null;
    personaInsights?: string | null;
    strategyInsights?: string | null;
  }>;
};

function compactPromptText(value: unknown, maxLength = 800) {
  const text = String(value || "").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function buildReferenceStyleBrief(account: PromptAccount) {
  const latest = account.referenceResearches?.[0];
  if (!latest) {
    const persistedResearch = compactPromptText(account.referenceAccounts, 1600);
    return persistedResearch
      ? `账号已沉淀的爆款研究启发：\n${persistedResearch}`
      : "暂无可用爆款研究风格摘要；按账号人设和本篇任务生成。";
  }

  const parts = [
    compactPromptText(latest.contentFeatures) && `内容表达特征：${compactPromptText(latest.contentFeatures)}`,
    compactPromptText(latest.personaInsights) && `人设表达启发：${compactPromptText(latest.personaInsights)}`,
    compactPromptText(latest.strategyInsights) && `结构与策略启发：${compactPromptText(latest.strategyInsights)}`
  ].filter(Boolean);
  return parts.join("\n") || "爆款研究没有可用风格摘要；按账号人设和本篇任务生成。";
}

export function buildTaskPrompt(input: {
  account: PromptAccount;
  strategy: AccountStrategy | null;
  weeklyPlan: WeeklyPlan;
  noteTask: NoteTask;
  expertRules?: string;
}) {
  const { account, strategy, weeklyPlan, noteTask, expertRules } = input;
  const strategySummary = strategy?.positioning ?? `${account.name} ${account.accountType} 账号`;
  return buildModeTaskPrompt({ account, strategySummary, weeklyPlan, noteTask, expertRules });
}

function baseContext(input: {
  account: PromptAccount;
  strategySummary: string;
  weeklyPlan: WeeklyPlan;
  noteTask: NoteTask;
  imagePanelName: string;
  expertRules?: string;
}) {
  const { account, strategySummary, weeklyPlan, noteTask, imagePanelName, expertRules } = input;
  return `## 模式
生成可直接填写到小红书发布页的标题和正文，但只允许保存到草稿箱，严禁真实发布和互动。

## 账号参数
--account ${account.accountParam}

## 上下文
- 账号图片素材目录：assets/${account.accountParam}/
- 图片任务输出：.openclaw_tasks/xhs-image-task-${noteTask.id}/image-paths.txt
- 图片处理：先在“${imagePanelName}”完成图片任务；本阶段只读取其成品图片清单，不重新生成或替换图片。
- 账号定位：${strategySummary}
- 账号对外人设：${account.personaBase || "真实、具体、克制，以能够核验的信息帮助用户做判断"}
- 本周目标：${weeklyPlan.goal}

## 本篇笔记任务
- 标题方向：${noteTask.topicTitle}
- 内容类型：${noteTask.contentType}
- 内容目标：${noteTask.contentGoal}
- 目标用户：${noteTask.targetUser}
- 痛点：${noteTask.painPoint}
- 核心观点：${noteTask.coreView}
- 正文结构：${noteTask.bodyStructure || "未填写，由品类结构库提供兜底结构"}
- 预期目标：${noteTask.expectedGoal}
- 封面方向：${noteTask.coverCopyDirection}
- 评论钩子：${noteTask.commentHook}
- 禁忌：${weeklyPlan.taboos || account.taboos || "遵守 AGENTS.md 禁区"}

## 爆款研究风格摘要
${buildReferenceStyleBrief(account)}

只学习上述摘要中的标题节奏、信息密度、情绪表达和内容组织方式；不得复制参考标题、正文句子、个人经历或具体数据。若研究启发与账号人设、本篇任务或事实边界冲突，以账号人设、本篇任务和事实边界为准。

## 已沉淀专家规则
${expertRules || "暂无已保存规则；按账号策划案和本篇任务生成。"}`;
}

const promptModeCopy: Record<AccountVisualMode, {
  title: string;
  imagePanelName: string;
  styleRules: string[];
  checkTitle: string;
}> = {
  culture_tourism: {
    title: "文旅目的地小红书笔记草稿 Prompt（发布精简版）",
    imagePanelName: "文旅图片创作",
    styleRules: [
      "这是文旅目的地发布稿，不是旅行社硬广，也不是完整旅游攻略。",
      "每篇只解决一个明确的出行问题；目的地、动线、活动、机位、交通票务和避坑信息按本篇内容类型选择，不要求全部写入。",
      "现场图只讲真实出现的地点、活动和服务；导览/票务图只讲可核验的信息。",
      "不伪造亲历、活动现场、人流、票价、开放状态、游客反馈和商家承诺。"
    ],
    checkTitle: "发布前人工检查"
  },
  heritage: {
    title: "民俗非遗小红书笔记草稿 Prompt（发布精简版）",
    imagePanelName: "民俗非遗图片创作",
    styleRules: [
      "这是民俗/非遗体验发布稿，不是猎奇故事，也不是泛泛文化口号。",
      "每篇只围绕一个工艺、作品、人物、体验或文化问题展开，不要求同时介绍流程、故事和预约。",
      "工艺图只讲真实作品、材料和步骤；人物图必须基于授权，不伪造传承人身份。",
      "不猎奇化民俗，不滥用族群/宗教符号，不伪造仪式、作品来源、活动现场和肖像授权。"
    ],
    checkTitle: "文化与授权检查"
  },
  stay: {
    title: "住宿/营地小红书笔记草稿 Prompt（发布精简版）",
    imagePanelName: "住宿图片创作",
    styleRules: [
      "这是民宿/酒店/营地发布稿，不是平台详情页复制，也不是夸张种草文。",
      "每篇只解决一个入住决策问题；房型、场景、周边、套餐、攻略和政策信息按本篇内容类型选择，不要求全部写入。",
      "空间图只讲真实房型、设施和景观；周边图只讲可确认的距离和体验。",
      "不伪造房型、景观、面积、房态、价格、退改、宠物/亲子政策和客人评价。"
    ],
    checkTitle: "入住前人工检查"
  },
  food: {
    title: "餐饮小红书笔记草稿 Prompt（发布精简版）",
    imagePanelName: "餐饮图片创作",
    styleRules: [
      "这是餐饮小红书发布稿，不是运营交付包，也不是大众点评长评。",
      "每篇必须先确定一个主轴：某个菜品、某个营销活动，或某个当地特色；不要一篇里散讲太多菜。",
      "菜品、套餐、当地特色、制作过程、环境交通和营销活动按本篇内容类型选择，不要求每篇同时覆盖。",
      "菜品图只讲图里真实出现的菜；环境图只讲真实门店环境或适合场景；交通漫画只讲真实停车、路口、地标和到店路径。",
      "没有商家确认时，不写具体价格、人均、距离、营业时间、食材来源、停车承诺和活动优惠；用待确认/需商家确认替代。",
      "不伪造亲身探店、顾客评价、排队火爆、销量、优惠、食材等级和交通便利性。"
    ],
    checkTitle: "发布前人工检查"
  },
  outdoor: {
    title: "户外路线小红书笔记草稿 Prompt（发布精简版）",
    imagePanelName: "路线图片创作",
    styleRules: [
      "这是户外路线小红书发布稿，不是旅行社广告，也不是完整户外安全手册。",
      "每篇只解决一个路线判断问题；路线体验、关键路况、风景、攻略、装备、交通补给和安全提醒按本篇内容类型选择，不要求全部写入。",
      "现场图只讲图里真实出现的风景、路况和季节；路线图只讲可核验的距离、爬升、起终点和节点。",
      "不伪造亲身经历、登顶、极端天气、轨迹数据、开放状态、救援风险和他人评价。"
    ],
    checkTitle: "出发前人工检查"
  },
  museum: {
    title: "展馆研学小红书笔记草稿 Prompt（发布精简版）",
    imagePanelName: "展馆研学图片创作",
    styleRules: [
      "这是博物馆/展览/研学发布稿，不是馆方公告复制，也不是泛泛打卡文。",
      "每篇只解决一个观展或研学问题；展览看点、展品故事、动线、亲子研学、票务和问答按本篇内容类型选择。",
      "展品图只讲真实展品和授权信息；导览图只讲可核验的参观路线。",
      "不伪造馆藏、展品来源、展期、票务、讲解员、观众评价和拍摄权限。"
    ],
    checkTitle: "展期与版权检查"
  },
  product: {
    title: "地域产品/文创小红书笔记草稿 Prompt（发布精简版）",
    imagePanelName: "产品文创图片创作",
    styleRules: [
      "这是地域特产/文创产品发布稿，不是电商详情页堆砌，也不是夸大功效文。",
      "每篇只解决一个购买或使用问题；产品卖点、产地、工艺、使用、送礼和购买问答按本篇内容类型选择。",
      "产品图只讲真实产品、包装和规格；工艺图只讲可核验的原料和制作过程。",
      "不伪造产地、销量、库存、功效、资质、用户评价和物流承诺。"
    ],
    checkTitle: "产品信息检查"
  },
  service: {
    title: "本地服务小红书笔记草稿 Prompt（发布精简版）",
    imagePanelName: "本地服务图片创作",
    styleRules: [
      "这是本地生活服务发布稿，不是夸张案例广告，也不是硬性成交话术。",
      "每篇只解决一个服务决策问题；用户问题、服务项目、流程、授权案例、空间和价格预约按本篇内容类型选择。",
      "流程图只讲真实服务步骤；案例图必须基于授权，不做夸张前后对比。",
      "不伪造顾客案例、效果、资质、价格、隐私授权和不可保证的结果。"
    ],
    checkTitle: "服务与授权检查"
  }
};

function buildModeTaskPrompt(input: {
  account: PromptAccount;
  strategySummary: string;
  weeklyPlan: WeeklyPlan;
  noteTask: NoteTask;
  expertRules?: string;
}) {
  const mode = accountVisualMode(input.account.accountType);
  const copy = promptModeCopy[mode];
  const imageCountLine = mode === "food" ? "图集默认 6 张" : "图集默认 5 张";
  const weddingAccount = isWeddingAccount(input.account);
  const promptTitle = weddingAccount ? "婚礼服务小红书笔记草稿 Prompt（发布精简版）" : copy.title;
  const imagePanelName = weddingAccount ? "婚礼图片创作" : copy.imagePanelName;
  const structure = resolveNoteContentStructure({
    mode,
    isWedding: weddingAccount,
    contentType: input.noteTask.contentType,
    topicTitle: input.noteTask.topicTitle,
    bodyStructure: input.noteTask.bodyStructure
  });
  const weddingRules = weddingAccount
    ? [
        "这是婚礼公司小红书发布稿，图片是选题入口，不是只做服务介绍。",
        "每篇只围绕一个真实婚礼细节或备婚问题；风格、场地、预算、流程和问答按本篇内容类型选择，不要求全部写入。",
        "参考同类型爆款文章的标题节奏、情绪表达、细节命名和收藏理由，但不得照搬原文或伪造数据。",
        "不能伪造新人反馈、真实案例授权、价格、档期、场地、花材成本和最终落地效果；未确认信息写待确认。"
      ]
    : [];
  return `# ${promptTitle}

${baseContext({ ...input, imagePanelName })}

## 本篇正文结构
- 内容品类：${structure.categoryName}
- 内容原型：${structure.archetypeName}
- 本篇核心作用：${structure.focus}
- 主结构：${structure.primaryStructure}
- 结构来源：${structure.structureSource === "note_task" ? "本篇 noteTask.bodyStructure，优先级高于品类结构库" : "本篇缺少 bodyStructure，使用品类结构库兜底"}
- 可选开场：${structure.openingOptions.join("；")}
- 按需补充：${structure.optionalInformation.join("、")}。只写与本篇主题直接相关且已经核验的信息，不要求全部补齐。
- 避免：${structure.avoid.join("；")}

不要固定使用“为什么值得去/值得买/值得住”开头，也不要机械重复“先……再……最后……”。开场方式必须服务于本篇内容目标，不要为了变化而强行变化。

## 品类与事实边界
- ${copy.styleRules.join("\n- ")}
${weddingRules.length ? `- ${weddingRules.join("\n- ")}\n` : ""}- 正文控制在 300-600 中文字；最多 6 个短段落。
- ${imageCountLine}仅作为策划参考，实际以 image-paths.txt 中的成品图片数量和顺序为准。
- 正文必须与整组图片表达一致，但不要机械地逐图解说，也不要求每张图对应一个独立句子。
- 使用当前账号设定的对外身份直接面向目标用户表达，语言自然、具体、有生活感，不要像硬广。
- 禁止出现“作为运营人员”“作为 AI”“本篇内容”“这篇笔记将介绍”“我们的内容策略”“接下来生成”等幕后创作语言。
- 商家账号可以使用符合实际的“我们”“店里”；个人账号只有在真实亲历已经明确时才能使用第一人称经历。没有亲历依据时使用客观说明，不得写“我走过”“我住过”“我体验过”。
- 不要解释为什么这样写，不要在发布正文中出现选题、运营、Prompt、模型、生成、素材缺口或内部核验过程。
- 如果图片或事实信息不足，不得编造；把缺口作为内部执行结果报告，不要写进标题或正文。

## 内部生成与检查
- 内部比较 3 个标题候选，选择最符合账号人设、本篇结构和小红书标题限制的 1 个，不输出候选过程。
- 内部完成图片与正文对应检查、事实检查和“${copy.checkTitle}”，不把检查过程写入发布内容。
- 内部确认正文没有运营分析、创作说明、图片说明、人工核验项或重复安全声明。

## 最终内容
只生成并写入以下最终内容：
1. 最终标题 1 个。
2. 正文发布稿 1 份，控制在 300-600 中文字、最多 6 个短段落。
3. 正文最后一行放 5-6 个话题标签。

不要把标题候选、封面文案、图集配文清单、置顶评论、检查清单或任何内部分析写入 title.txt 和 content.txt。`;
}
