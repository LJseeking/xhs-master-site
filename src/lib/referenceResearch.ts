import type { Account, AccountTypeTemplate } from "@prisma/client";

function q(value: string) {
  return JSON.stringify(value);
}

export function buildReferenceResearchKeywords(account: Account, template: AccountTypeTemplate) {
  const pieces = [
    template.name,
    account.city,
    account.targetUsers,
    account.contentDirections,
    account.painPoints
  ]
    .flatMap((item) => item.split(/[，,、\n/]/))
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(pieces)).slice(0, 8).join(" ");
}

export function buildReferenceResearchCommands(account: Account, template: AccountTypeTemplate) {
  const base = "uv run xiaohongshu_auto_op";
  const accountFlag = `--account ${q(account.accountParam)}`;
  const keyword = buildReferenceResearchKeywords(account, template);
  const cityKeyword = [account.city, template.name].filter(Boolean).join(" ");
  const painKeyword = [account.painPoints.split(/[，,、\n]/).find(Boolean), template.name].filter(Boolean).join(" ");

  return [
    {
      category: "同类型账号搜索",
      command: `${base} xhs-explore search --keyword ${q(keyword)} ${accountFlag} --limit 30`,
      description: "搜索同类型账号和爆款笔记，优先找稳定更新、互动质量高的参考对象。",
      safetyNote: "只读探索命令，不发布、不互动。"
    },
    {
      category: "城市/场景搜索",
      command: `${base} xhs-explore search --keyword ${q(cityKeyword || keyword)} ${accountFlag} --limit 20`,
      description: "如果账号有城市或明确场景，用本地化关键词找到更贴近的参考账号。",
      safetyNote: "只读探索命令，不发布、不互动。"
    },
    {
      category: "痛点关键词搜索",
      command: `${base} xhs-explore search --keyword ${q(painKeyword || keyword)} ${accountFlag} --limit 20 --include-comments`,
      description: "从笔记和评论中提取目标用户真实问题与内容切口。",
      safetyNote: "只读探索命令，不发布、不互动。"
    },
    {
      category: "参考主页分析",
      command: `${base} xhs-explore user-profile --user-url ${q("粘贴参考账号主页 URL")} ${accountFlag} --include-notes --limit 20`,
      description: "对候选参考账号主页做内容栏目、标题、封面、互动方式分析。",
      safetyNote: "只读探索命令，不关注、不私信。"
    }
  ];
}

export function buildReferenceResearchPrompt(account: Account, template: AccountTypeTemplate) {
  return `# 给 xiaohongshu_auto_op skill 的参考账号研究 Prompt

## 当前执行模式
只读研究，不允许真实发布、评论、点赞、收藏、关注或私信。

## 账号参数
--account ${account.accountParam}

## 研究目标
在小红书中搜索「${template.name}」同类型账号，筛选 5-10 个值得参考的账号，并总结它们的内容特色。研究结果将用于生成账号「${account.name}」的人设文件和策划案。

## 我方账号基础信息
- 账号名称：${account.name}
- 账号类型：${template.name}
- 阶段：${account.stage}
- 城市：${account.city || "未设置"}
- 人设基础：${account.personaBase || "待根据参考账号研究补全"}
- 目标用户：${account.targetUsers || "待根据参考账号研究补全"}
- 用户痛点：${account.painPoints || "待根据参考账号研究补全"}
- 内容方向：${account.contentDirections || "待根据参考账号研究补全"}
- 商业目标：${account.businessGoals || "待根据参考账号研究补全"}
- 禁忌事项：${account.taboos || "遵守平台规则，不伪造体验"}

## 搜索建议
- 同类型关键词：${buildReferenceResearchKeywords(account, template)}
- 城市/场景关键词：${[account.city, template.name].filter(Boolean).join(" ") || template.name}
- 痛点关键词：${[account.painPoints.split(/[，,、\n]/).find(Boolean), template.name].filter(Boolean).join(" ") || template.name}

## 请返回
1. 候选参考账号列表：账号名、主页 URL、粉丝量/互动情况、适合参考的原因
2. 每个账号的内容栏目
3. 每个账号的标题风格
4. 每个账号的封面风格
5. 每个账号的互动方式
6. 爆款/高互动笔记的共同点
7. 用户评论里反复出现的痛点
8. 我方账号可以借鉴的部分
9. 我方账号必须避免同质化的部分
10. 对人设、栏目、标题、封面、商业化路径的建议

## 约束
- 不要编造搜索不到的数据。
- 如果某项数据缺失，请写“未获取到”。
- 网络参考素材只允许用于分析，不允许作为我方真实素材发布。
- 输出研究报告即可，不执行任何账号操作。`;
}

export function fallbackReferenceSummary(rawResults: string) {
  const excerpt = rawResults.slice(0, 3000);
  return {
    summaryMarkdown: `# 参考账号研究总结

已保存 xiaohongshu_auto_op 返回结果，但当前未使用大模型深度总结。

## 原始结果摘录
${excerpt || "暂无原始结果。"}

## 使用建议
- 请补充 OpenAI API key 后重新总结，或手工整理参考账号内容特色。
- 生成策划案时应重点参考账号栏目、标题、封面、评论痛点和差异化机会。`,
    contentFeatures: "待补充：参考账号内容栏目、标题、封面、互动方式。",
    personaInsights: "待补充：参考账号人设表达与可差异化人设方向。",
    strategyInsights: "待补充：基于参考账号研究更新策划案。"
  };
}
