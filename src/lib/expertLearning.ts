import type { Account, AccountTypeTemplate, ExpertRule, NoteTask } from "@/types/domain";

function q(value: string) {
  return JSON.stringify(value);
}

function compact(value: unknown) {
  return String(value || "").trim() || "未填写";
}

export function formatExpertRulesForPrompt(rules?: ExpertRule[] | null) {
  const activeRules = (rules || [])
    .filter((rule) => rule.rule.trim())
    .slice(0, 12);
  if (!activeRules.length) return "";
  return activeRules
    .map((rule, index) => `${index + 1}. [${rule.module} / ${rule.source || "manual"} / 置信度 ${rule.confidence}] ${rule.rule}`)
    .join("\n");
}

export function buildPostReviewPrompt(input: {
  account: Account;
  noteTask?: NoteTask | null;
  postTitle?: string;
  postUrl?: string;
  publishedAt?: string;
  metrics?: string;
  comments?: string;
  actualContent?: string;
  expertFeedback?: string;
  editComparison?: string;
  subjective?: string;
  distillGoal?: string;
}) {
  const task = input.noteTask;
  return `# 单篇小红书帖子专家复盘 Prompt

请只复盘这一条帖子，并从这一条帖子的真实表现、评论反馈、专家改稿和用户修改中提炼可复用规则。只分析，不执行任何真实账号操作。

核心目标：每条帖子都形成一次“经验沉淀”。不要写成周报，不要泛泛总结账号整体；必须围绕这一条帖子判断：为什么有效、为什么无效、下次同类帖子应该怎么生成。

## 账号信息
- 账号名称：${input.account.name}
- 账号类型：${input.account.accountType}
- 所在城市：${input.account.city || "未填写"}
- 目标用户：${input.account.targetUsers || "未填写"}
- 用户痛点：${input.account.painPoints || "未填写"}
- 内容方向：${input.account.contentDirections || "未填写"}
- 禁忌事项：${input.account.taboos || "遵守平台规则，不伪造体验"}

## 本次复盘帖子
- 选题/标题：${compact(input.postTitle || task?.topicTitle)}
- 发布链接：${compact(input.postUrl)}
- 发布时间：${compact(input.publishedAt || task?.publishAt)}
- 原计划内容类型：${compact(task?.contentType)}
- 原计划内容目标：${compact(task?.contentGoal)}
- 原计划核心观点：${compact(task?.coreView)}
- 原计划图片要求：${compact(task?.requiredImages)}
- 原计划评论钩子：${compact(task?.commentHook)}

## 实际发布内容
${compact(input.actualContent)}

## 发布表现数据
${compact(input.metrics)}

## 评论区 / 私信 / 用户反馈
${compact(input.comments)}

## 专家点评 / 用户修改意见
${compact(input.expertFeedback)}

## 修改前后对比
${compact(input.editComparison)}

## 主观观察
${compact(input.subjective)}

## 希望沉淀的能力
${input.distillGoal || "提炼这一篇对应的标题规则、封面规则、图片方案规则、正文规则、评论引导规则、风险规则和下次测试变量。"}

## 请输出
1. 单帖结论：这篇帖子最值得保留和最需要修正的地方。
2. 数据诊断：曝光、点击、收藏、评论、私信、转化各自说明什么；数据不足时明确写“证据不足”。
3. 标题诊断：标题是否具体、是否像用户问题、是否有点击理由、是否有广告感。
4. 封面/图片诊断：真实感、信息密度、图集顺序、图上文字和 AI 味风险。
5. 正文诊断：开头、信息密度、收藏价值、可信边界、转化边界。
6. 评论/私信诊断：用户真实关心什么，下次要不要把问题前置进选题。
7. 专家修改洞察：如果有专家改稿，说明专家为什么这么改。
8. 下次同类帖子改法：给出可直接执行的标题、封面、图片、正文、评论引导调整建议。
9. 下次测试变量：最多 2 个，不要一次测试太多变量。

## 可加入规则库的候选规则
请额外输出 JSON 数组，供系统日积月累沉淀专家技能。每条规则必须来自本帖证据：

\`\`\`json
[
  {
    "accountType": "${input.account.accountType}",
    "module": "title | cover | image_plan | body | interaction | risk | positioning",
    "rule": "可复用的专家规则",
    "positiveExample": "好的例子",
    "negativeExample": "差的例子",
    "reason": "为什么这条规则成立",
    "source": "post_performance | comments | expert_feedback | user_edit | subjective_observation",
    "confidence": 0.0,
    "applicableWhen": "适用场景",
    "notApplicableWhen": "不适用场景",
    "nextTest": "下次如何验证"
  }
]
\`\`\`

要求：
- 不要把相关性说成确定因果。
- 如果只是一篇帖子得到的经验，confidence 不得超过 0.6。
- 如果有连续多篇相同证据，才可以写 confidence 0.7 以上。
- 规则用于后续生成 Prompt，不是直接对外发布文案。`;
}

export function buildIndustryLearningKeywords(account: Account, template?: AccountTypeTemplate | null, topic?: string) {
  const pieces = [
    "全国",
    "小红书运营",
    "爆款拆解",
    "内容方法论",
    template?.name || account.accountType,
    account.targetUsers,
    account.contentDirections,
    account.painPoints,
    topic || "标题 封面 图文 笔记 复盘"
  ]
    .join(" ")
    .replace(/[，。；、\n/]+/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(pieces)).slice(0, 18).join(" ");
}

export function buildIndustryLearningCommands(account: Account, template?: AccountTypeTemplate | null, topic?: string) {
  const base = "uv run xiaohongshu_auto_op";
  const accountFlag = `--account ${q(account.accountParam)}`;
  const keyword = buildIndustryLearningKeywords(account, template, topic);
  return [
    {
      category: "小红书站内行业学习",
      command: `${base} xhs-explore search --keyword ${q(keyword)} ${accountFlag} --limit 40 --include-notes --include-comments`,
      description: "只读搜索全国同类型高互动内容、运营方法论、爆款拆解和评论痛点，作为外部经验输入。",
      safetyNote: "只读研究命令，不发布、不关注、不私信、不互动。"
    },
    {
      category: "全网文章学习",
      command: `用浏览器或搜索引擎搜索：${q(`${keyword} 文章 案例 拆解 方法论`)}`,
      description: "补充小红书站外文章、案例拆解、课程笔记和运营专家观点，避免只从单个平台样本学习。",
      safetyNote: "只做阅读和摘录，不复制他人内容用于发布。"
    }
  ];
}

export function buildIndustryLearningPrompt(input: {
  account: Account;
  template?: AccountTypeTemplate | null;
  topic?: string;
  searchScope?: string;
}) {
  const topic = input.topic || "小红书图文爆款方法、标题封面、图片真实感、评论转化和复盘方法";
  const keywords = buildIndustryLearningKeywords(input.account, input.template, topic);
  return `# 小红书行业学习与专家技能蒸馏 Prompt

请基于广泛搜索到的相关文章、爆款拆解、运营专家观点、小红书站内高互动案例和评论反馈，为账号「${input.account.name}」提炼可复用运营规则。只做研究和总结，不执行任何真实账号操作。

## 研究边界
- 搜索范围：${input.searchScope || "全国 / 全网优先，本地只作为补充"}
- 研究主题：${topic}
- 关键词：${keywords}

重要原则：外部学习不能局限在账号当地，也不能只看本地同类内容。必须优先吸收全国成熟账号、行业文章、专家拆解和高互动案例里的共性方法，再判断哪些适合当前账号落地。

## 当前账号
- 账号名称：${input.account.name}
- 账号类型：${input.template?.name || input.account.accountType}
- 城市：${input.account.city || "未填写"}
- 阶段：${input.account.stage}
- 目标用户：${input.account.targetUsers || "未填写"}
- 用户痛点：${input.account.painPoints || "未填写"}
- 内容方向：${input.account.contentDirections || "未填写"}
- 商业目标：${input.account.businessGoals || "未填写"}
- 禁忌事项：${input.account.taboos || "遵守平台规则，不伪造体验"}

## 请先收集
1. 全国同类型爆款笔记或账号：标题、封面、图集、评论痛点、转化方式。
2. 运营专家文章/课程/拆解：标题方法、封面方法、图文结构、真实感、评论引导、复盘方法。
3. 当前账号可借鉴的规律：哪些可直接用，哪些需要改造。
4. 不适合照搬的套路：本地条件、素材授权、AI 味、平台风险、硬广感。

## 输出格式
1. 资料来源摘要：按“小红书站内 / 全网文章 / 专家观点 / 评论痛点”分组。
2. 核心方法提炼：标题、封面、图片方案、正文、评论互动、转化、复盘各 3-5 条。
3. 对当前账号的适配判断：哪些马上加入生成规则，哪些只作为观察。
4. 风险边界：不能伪造真实案例、不能盗图、不能把 AI 图伪装成真实素材、不能编造价格/档期/路线/库存/资质。
5. 下周验证计划：最多 3 个测试变量。

## 可加入规则库的候选规则
请额外输出 JSON 数组，字段如下：

\`\`\`json
[
  {
    "accountType": "${input.account.accountType}",
    "module": "title | cover | image_plan | body | interaction | risk | positioning",
    "rule": "可复用的专家规则",
    "positiveExample": "好的例子",
    "negativeExample": "差的例子",
    "reason": "为什么这条规则成立",
    "source": "industry_article | expert_article | xhs_hot_note | comments | case_study",
    "confidence": 0.0,
    "applicableWhen": "适用场景",
    "notApplicableWhen": "不适用场景",
    "nextTest": "如何在当前账号验证"
  }
]
\`\`\`

要求：
- 每条规则都要说明来源类型，不要凭空编造。
- 站外文章观点只能作为启发，必须结合小红书真实内容形态验证。
- 不要照搬别人的标题和正文，只提炼方法。
- 规则用于后续生成 Prompt，不是直接对外发布文案。`;
}
