export function buildWeeklyReportPrompt(input: {
  accountName: string;
  weekLabel: string;
  rows: Array<Record<string, string>>;
  subjective: string;
}) {
  return `# 小红书周报复盘 Prompt

请基于以下数据，为账号「${input.accountName}」生成运营复盘。只分析，不执行任何真实账号操作。

## 周期
${input.weekLabel}

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

## 请输出
1. 本周整体表现
2. 表现最好的内容
3. 表现最差的内容
4. 标题表现
5. 封面表现
6. 选题表现
7. 人设一致性
8. 用户反馈
9. 下周优化方向
10. 下周内容计划

要求：指出最可能的因果假设和下周可测试变量，不要把相关性说成确定因果。`;
}
