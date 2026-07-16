import { accountTypeTemplates, getTemplateByKey } from "@/data/accountTypeTemplates";
import { buildAccountStrategy } from "@/lib/strategy";

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

function getBrowserLlmStatus() {
  return {
    enabled: Boolean(process.env.NEXT_PUBLIC_OPENAI_API_KEY),
    model: process.env.NEXT_PUBLIC_OPENAI_MODEL || process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-5.5",
    baseUrl: process.env.NEXT_PUBLIC_OPENAI_BASE_URL || "https://api.openai.com/v1"
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

async function createChatCompletionResponse(
  input: { instructions: string; input: string },
  baseUrl: string,
  model: string,
  signal: AbortSignal
) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: input.instructions },
        { role: "user", content: input.input }
      ],
      stream: false
    }),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Chat Completions API ${response.status}: ${errorText.slice(0, 600)}`);
  }

  const json = await response.json();
  const text = extractChatCompletionText(json);
  if (!text) throw new Error("Chat Completions API 没有返回文本内容。");
  return text;
}

async function createTextResponse(input: { instructions: string; input: string }) {
  const status = getBrowserLlmStatus();
  const baseUrl = status.baseUrl.replace(/\/$/, "");
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort("AI request timeout"), 8 * 60 * 1000);

  try {
    const response = await fetch(`${baseUrl}/responses`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: status.model,
        instructions: input.instructions,
        input: input.input,
        store: false
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      const shouldFallbackToChat =
        response.status === 404 ||
        response.status === 405 ||
        (response.status === 400 && looksLikeUnsupportedResponses(errorText));
      if (!shouldFallbackToChat) {
        throw new Error(`OpenAI API ${response.status}: ${errorText.slice(0, 600)}`);
      }
      return await createChatCompletionResponse(input, baseUrl, status.model, controller.signal);
    }

    const json = await response.json();
    const text = extractText(json);
    if (!text) throw new Error("OpenAI API 没有返回文本内容。");
    return text;
  } finally {
    window.clearTimeout(timeoutId);
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
    return { usedLlm: false, data: fallback, error: "NEXT_PUBLIC_OPENAI_API_KEY 未配置，已使用内置模板生成。" };
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
