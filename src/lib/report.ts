export function buildWeeklyReportPrompt(input: {
  accountName: string;
  accountType?: string;
  reviewMode?: string;
  weekLabel: string;
  rows: Array<Record<string, string>>;
  subjective: string;
  expertFeedback?: string;
  editComparison?: string;
  effectivePatterns?: string;
  failedPatterns?: string;
  distillGoal?: string;
}) {
  return `# 小红书专家复盘 Prompt

请基于以下数据，为账号「${input.accountName}」生成专家复盘，并从专家意见、用户修改和发布结果中提炼可复用的小红书运营规则。只分析，不执行任何真实账号操作。

复盘目标不是简单总结数据，而是沉淀专家技能：把“为什么这样改更好”“什么场景适用”“下次生成应该遵守什么规则”结构化输出。

## 周期
${input.weekLabel}

## 账号类型
${input.accountType || "未填写"}

## 复盘场景
${input.reviewMode === "expert_edit" ? "专家改稿复盘：重点从专家点评、用户修改和客户反馈中提炼规则。" : input.reviewMode === "performance" ? "发布表现复盘：重点从曝光、点击、收藏、评论、私信和转化中提炼规律。" : input.reviewMode === "rule" ? "沉淀专家规则：重点把有效/无效模式结构化为规则候选。" : "综合专家复盘"}

## 发布笔记数据
${input.rows
  .map(
    (row, index) => `### ${index + 1}. ${row.title || "未命名笔记"}
- 曝光：${row.impressions || "0"}
- 点击：${row.clicks || "0"}
- 点赞：${row.likes || "0"}
- 收藏：${row.saves || "0"}
- 评论：${row.comments || "0"}
- 私信：${row.messages || "0"}
- 转化：${row.conversions || "0"}`
  )
  .join("\n\n")}

## 主观观察
${input.subjective || "无"}

## 专家意见 / 用户修改意见
${input.expertFeedback || "无"}

## 修改前后对比
${input.editComparison || "无"}

## 本周有效模式
${input.effectivePatterns || "无"}

## 本周无效模式
${input.failedPatterns || "无"}

## 希望沉淀的能力
${input.distillGoal || "提炼标题规则、封面规则、图片方案规则、正文规则、风险规则和下周测试变量。"}

## 请输出
1. 本周整体表现：不要只看曝光，也要看收藏、评论、私信和转化。
2. 表现最好的内容：指出可能有效的标题、封面、选题、图集、正文和评论引导因素。
3. 表现最差的内容：指出最可能的问题，不要把相关性说成确定因果。
4. 专家修改洞察：从专家意见和修改前后对比中提炼“专家为什么这样改”。
5. 标题专家规则：输出适合该账号类型的标题规则、反例和正例。
6. 封面/图片专家规则：输出真实素材、AI 辅助图、图集顺序和信息卡的规则。
7. 正文专家规则：输出开头、信息密度、收藏价值、评论引导和转化边界的规则。
8. 风险规则：广告感、AI 味、虚假案例、价格/路线/档期/授权等风险。
9. 下周测试变量：最多 3 个，避免一次测试过多变量。
10. 下周内容建议：给出 3-5 个可执行选题方向。

## 专家规则沉淀
请额外输出一个“可加入规则库的候选规则”区块。每条规则按 JSON 输出，字段如下：

\`\`\`json
[
  {
    "accountType": "${input.accountType || "unknown"}",
    "module": "title | cover | image_plan | body | interaction | risk | positioning",
    "rule": "可复用的专家规则",
    "positiveExample": "好的例子",
    "negativeExample": "差的例子",
    "reason": "为什么这条规则成立",
    "source": "expert_feedback | user_edit | performance_data | subjective_observation",
    "confidence": 0.0,
    "applicableWhen": "适用场景",
    "notApplicableWhen": "不适用场景",
    "nextTest": "下次如何验证"
  }
]
\`\`\`

要求：
- 规则必须来自本次输入，不要凭空编造专家结论。
- 如果证据不足，confidence 不得超过 0.6。
- 明确哪些只是因果假设，哪些可以作为下周测试变量。
- 规则用于后续生成 Prompt，不是直接对外发布文案。

要求：指出最可能的因果假设和下周可测试变量，不要把相关性说成确定因果。`;
}
