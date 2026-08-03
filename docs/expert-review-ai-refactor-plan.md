# 专家复盘 AI 自动化改造方案

> 状态：待开发
> 更新日期：2026-07-31
> 适用项目：`xhs-master-site`、`xhs_server`

## 1. 改造目标

将当前“生成单帖复盘 Prompt -> 用户复制给外部模型 -> 手工粘贴规则 JSON -> 手工保存”的流程，改造成站内自动化流程：

```text
用户填写单篇帖子复盘信息
-> 点击“执行专家复盘”
-> 调用后端 AI
-> AI 生成复盘结论和候选规则
-> 自动保存复盘记录及候选规则到服务端数据库
-> 页面展示本次已保存规则
-> 后续笔记草稿和图片方案自动参考规则
```

## 2. 产品边界

### 2.1 新流程支持

- 在当前系统内调用后端 AI 完成单篇帖子复盘。
- 自动解析 AI 返回的结构化结果。
- 自动保存复盘记录和候选规则。
- 展示本次已保存的候选规则。
- 刷新页面或更换设备后仍能读取历史规则。
- 后续笔记草稿、图片方案和图片精修继续自动参考规则。

### 2.2 移除的能力

- 不再展示“复盘 Prompt”板块。
- 不再提供 Prompt 复制按钮。
- 不再下载 `post-review-*.md`。
- 不再使用 OpenClaw 执行专家复盘。
- 不再要求用户手工粘贴候选规则 JSON。
- 不再显示“保存候选规则”表单。
- 不再要求用户手动点击“保存到规则库”。

## 3. 页面交互

## 3.1 单篇帖子复盘表单

保留：

- 关联笔记任务
- 实际发布标题
- 帖子链接
- 发布时间
- 实际发布正文和图片顺序
- 专家点评或客户反馈
- 修改前后对比
- 用户主观观察
- 希望沉淀的能力

修改：

- “发布表现数据”标记为可选。
- “评论区 / 私信 / 用户反馈”标记为可选。
- “生成单帖复盘 Prompt”改为“执行专家复盘”。
- 执行中的按钮文案改为“正在执行专家复盘...”。

## 3.2 最低证据要求

发布表现数据和评论反馈可以为空，但为了避免 AI 只复述原计划，以下字段至少填写一项：

```text
实际发布正文或图片顺序
发布表现数据
评论、私信或用户反馈
专家点评
修改前后对比
主观观察
```

如果全部为空，阻止执行并提示：

```text
请至少填写一项实际发布内容、表现数据或复盘观察。
```

## 3.3 本次复盘结果

删除原“复盘 Prompt”板块，替换为“本次复盘沉淀规则”。

状态设计：

- 初始：执行复盘后，这里会显示自动保存的候选规则。
- 执行中：显示 loading。
- AI 完成但正在保存：显示“正在保存规则...”。
- 成功：显示“已保存到规则库”。
- 失败：显示明确的 AI 或数据库错误，不显示成功状态。

每条规则展示：

- 所属模块
- 规则内容
- 置信度
- 规则依据
- 适用场景
- 不适用场景
- 下次验证方式

## 3.4 最近经验

保留现有“最近经验”区域，但数据来源改为服务端规则库。

建议展示：

- 最近更新的规则
- 模块
- 来源
- 置信度
- 是否启用
- 证据数量

## 4. AI 调用流程

专家复盘调用一次后端文本 AI。

继续复用现有后端 AI 异步接口：

```text
POST /client/ai/v1/complete
GET  /client/ai/v1/complete/result?uuid=...
```

`xhs-master-site` 提供业务 API Route：

```text
POST /api/accounts/{accountId}/post-reviews
GET  /api/accounts/{accountId}/post-reviews?uuid=...
```

POST 创建异步复盘任务，GET 查询任务状态和结果。

## 5. AI 输入

AI 输入需要包含：

### 5.1 账号上下文

- 账号名称
- 账号类型
- 所在城市
- 账号人设
- 目标用户
- 用户痛点
- 内容方向
- 禁忌事项
- 当前完整策划案摘要

### 5.2 原计划内容

- 关联笔记 ID
- 计划标题
- 内容类型
- 内容目标
- 核心观点
- 正文结构
- 图片要求
- 封面方向
- 评论钩子
- 预期目标

### 5.3 实际发布证据

- 实际发布标题
- 帖子链接
- 发布时间
- 实际发布正文和图片顺序
- 发布表现数据
- 评论、私信和用户反馈
- 专家点评
- 修改前后对比
- 用户主观观察
- 希望沉淀的能力

没有填写的字段必须标记为“未提供”。AI 不得推测缺失数据。

## 6. AI 输出

要求 AI 只返回 JSON，不返回 Markdown 代码块：

```json
{
  "summary": "本篇复盘结论",
  "evidenceAssessment": "当前证据充分程度及局限",
  "rules": [
    {
      "accountType": "户外路线",
      "module": "title",
      "rule": "路线标题应同时包含地点和适用人群",
      "positiveExample": "杭州周边适合新手的轻徒步路线",
      "negativeExample": "周末一起去爬山",
      "reason": "带地点和适用人群的标题提供了更明确的决策信息",
      "source": "post_performance",
      "confidence": 0.55,
      "applicableWhen": "路线攻略类内容",
      "notApplicableWhen": "纯风景情绪内容",
      "nextTest": "下一篇对比有无适用人群信息"
    }
  ]
}
```

## 6.1 允许的规则模块

```text
title
cover
image_plan
body
interaction
risk
positioning
```

## 6.2 允许的规则来源

```text
post_performance
comments
expert_feedback
user_edit
subjective_observation
```

## 6.3 AI 结果校验

- `summary` 必须是字符串。
- `evidenceAssessment` 必须是字符串。
- `rules` 必须是数组。
- 每条规则必须包含 `module` 和非空 `rule`。
- 单篇帖子产生的规则 `confidence` 最高为 `0.6`。
- 数据不足时允许返回空规则数组。
- 不得把相关性表述为确定因果。
- AI 返回格式异常时不保存复盘或规则。

## 7. 服务端数据设计

## 7.1 `post_reviews`

建议字段：

| 字段 | 含义 |
|---|---|
| `id` | 复盘记录 ID |
| `account_id` | 所属账号 |
| `note_task_id` | 关联单篇任务，可空 |
| `post_title` | 实际发布标题 |
| `post_url` | 帖子链接 |
| `published_at` | 发布时间 |
| `actual_content` | 实际发布正文和图片顺序 |
| `metrics` | 发布表现数据 |
| `comments_feedback` | 评论、私信和用户反馈 |
| `expert_feedback` | 专家点评或客户反馈 |
| `edit_comparison` | 修改前后对比 |
| `subjective_observation` | 用户主观观察 |
| `distill_goal` | 希望沉淀的能力 |
| `summary_markdown` | AI 复盘结论 |
| `evidence_assessment` | 证据充分程度及局限 |
| `ai_model` | 实际使用的模型 |
| `status` | completed 或 failed |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

不建议把所有复盘输入只保存在一个 JSON 字段中，主要信息应使用明确字段。

## 7.2 `expert_rules`

建议字段：

| 字段 | 含义 |
|---|---|
| `id` | 规则 ID |
| `account_id` | 所属账号 |
| `post_review_id` | 来源复盘记录 |
| `account_type` | 账号类型 |
| `module` | 规则模块 |
| `rule` | 规则正文 |
| `positive_example` | 正面示例 |
| `negative_example` | 反面示例 |
| `reason` | 规则依据 |
| `source` | 证据来源 |
| `confidence` | 置信度 |
| `applicable_when` | 适用场景 |
| `not_applicable_when` | 不适用场景 |
| `next_test` | 下次验证方法 |
| `status` | 规则成熟度，初始为 candidate |
| `enabled` | 是否参与后续生成，初始为 true |
| `evidence_count` | 支持该规则的证据数量 |
| `rule_hash` | 规则标准化哈希 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

规则初始状态：

```text
status = candidate
enabled = true
```

`candidate` 表示规则成熟度，`enabled=true` 表示规则会自动参与后续生成。

## 8. 服务端保存接口

建议增加事务接口：

```text
POST /client/postReview/v1/saveResult
```

请求示例：

```json
{
  "accountId": 12,
  "noteTaskId": 66,
  "input": {
    "postTitle": "...",
    "postUrl": "...",
    "publishedAt": "...",
    "actualContent": "...",
    "metrics": "...",
    "comments": "...",
    "expertFeedback": "...",
    "editComparison": "...",
    "subjective": "...",
    "distillGoal": "..."
  },
  "summary": "...",
  "evidenceAssessment": "...",
  "aiModel": "gpt-5.5",
  "rules": []
}
```

服务端必须在一个事务中：

1. 校验当前用户拥有该账号。
2. 校验 `noteTaskId` 属于该账号。
3. 保存复盘记录。
4. 对候选规则进行校验和去重。
5. 保存或更新候选规则。
6. 返回复盘记录和实际保存的规则。
7. 任一步失败则整体回滚。

账号详情接口需要返回：

```json
{
  "postReviews": [],
  "expertRules": []
}
```

## 9. 自动保存流程

前端完整流程：

1. 校验表单最低证据要求。
2. 调用本地复盘 API Route 创建异步 AI 任务。
3. 轮询 AI 任务结果。
4. 解析和校验 AI JSON。
5. 调用服务端 `saveResult`。
6. 服务端事务性保存复盘和规则。
7. 保存成功后更新当前账号状态。
8. 显示“已保存到规则库”及本次规则。

数据库保存失败时：

- 不显示“已保存”。
- 自动重试最多两次。
- 仍失败时显示“复盘已生成，但保存规则失败，请重新执行”。
- 不要求用户手工粘贴 JSON。

## 10. 重复规则处理

自动保存后必须防止相同规则无限累积。

服务端对以下内容标准化后计算 `rule_hash`：

```text
account_id + module + normalized(rule)
```

如果相同哈希已经存在：

- 不创建重复规则。
- `evidence_count + 1`。
- 更新最新 `post_review_id`。
- 更新 `updated_at`。
- 根据新增证据适度调整置信度。
- 置信度不得超过服务端设定上限。

第一阶段只做标准化文本去重，不做复杂语义相似度判断。

## 11. 后续生成自动参考

保留规则注入位置：

- 笔记草稿 Prompt
- 图片方案 Prompt
- 图片精修 AI Prompt

规则来源改为服务端账号详情返回的 `expertRules`。

筛选原则：

```text
enabled = true
优先选择当前生成模块相关规则
按 confidence 降序
按 updatedAt 降序
最多使用 12 条
```

正文生成优先：

```text
title
body
interaction
risk
positioning
```

图片生成优先：

```text
cover
image_plan
risk
positioning
```

规则只影响内部生成 Prompt，不得直接作为面向用户发布的正文。

## 12. 前端改动范围

预计修改：

- `src/app/components/XhsMasterApp.tsx`
- `src/lib/expertLearning.ts`
- `src/lib/api.ts`
- `src/app/api/accounts/[id]/post-reviews/route.ts`
- `src/lib/browserWorkspace.ts`
- `src/lib/prompt.ts`
- `src/lib/imagePrompts.ts`
- `src/lib/imageRefinementLlm.ts`

需要删除或停用：

- `postReviewPrompt` 前端状态
- Prompt 复制和下载逻辑
- `saveExpertRules()` 手工保存方法
- 专家复盘页面的规则 JSON 输入框
- 专家复盘页面的“保存到规则库”按钮

`/api/accounts/[id]/expert-rules` 可以暂时保留用于兼容其他入口，但专家复盘新流程不再调用手工保存接口。

## 13. 前后端职责

### `xhs-master-site`

- 表单和结果界面。
- 最低证据校验。
- 组织 AI 输入。
- 调用后端 AI 和轮询结果。
- 解析、校验 AI JSON。
- 调用服务端保存接口。
- 将服务端规则注入笔记草稿和图片方案。

### `xhs_server`

- 持久化复盘记录。
- 持久化候选规则。
- 账号和任务归属校验。
- 数据库事务。
- 规则去重和证据累计。
- 账号详情返回复盘记录和专家规则。

## 14. 开发顺序

1. 服务端创建或完善 `post_reviews` 和 `expert_rules`。
2. 服务端实现事务保存接口和账号详情返回。
3. 前端接入服务端复盘和规则类型。
4. 将固定 Prompt 生成接口改造成异步 AI 复盘接口。
5. 删除 Prompt 展示、下载和手工保存 UI。
6. 实现“执行专家复盘”和自动保存。
7. 将规则来源切换到服务端。
8. 优化正文和图片方案的规则筛选。
9. 完成接口、异常、刷新恢复和跨设备测试。

## 15. 验收标准

- 点击“执行专家复盘”会真实调用后端 AI。
- 页面不再展示、复制或下载复盘 Prompt。
- 专家复盘不依赖 OpenClaw。
- 发布表现和评论反馈可以为空。
- 全部实际证据为空时阻止执行。
- AI 返回异常时不会保存脏数据。
- 复盘记录和规则在同一事务中保存。
- 成功后展示“已保存到规则库”和本次规则。
- 用户不需要粘贴 JSON 或手动保存。
- 刷新和更换设备后规则仍然存在。
- 重复规则不会无限新增。
- 规则自动影响后续笔记草稿和图片方案。
- 数据库保存失败时不会显示虚假的保存成功状态。
