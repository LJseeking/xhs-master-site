import { getBackendApiBaseUrl } from "@/lib/backendApi";

type BackendAiResult =
  | { ok: true; text: string; model: string }
  | { ok: false; error: string };

export async function completeWithBackendAi(input: {
  instructions: string;
  input: string;
  model?: string;
  signal?: AbortSignal;
}): Promise<BackendAiResult> {
  try {
    const response = await fetch(`${getBackendApiBaseUrl()}/ai/v1/complete`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "xhs-language": "zh-cn"
      },
      body: JSON.stringify({
        instructions: input.instructions,
        input: input.input,
        model: input.model
      }),
      signal: input.signal
    });

    const json = (await response.json().catch(() => ({}))) as {
      status?: boolean;
      message?: string;
      data?: { text?: string; model?: string };
    };

    if (!response.ok || !json.status || !json.data?.text) {
      return { ok: false, error: json.message || "AI 接口调用失败。" };
    }

    return {
      ok: true,
      text: json.data.text,
      model: json.data.model || ""
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "AI 接口调用失败。" };
  }
}
