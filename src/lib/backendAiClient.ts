import { getBackendApiBaseUrl } from "@/lib/backendApi";

type BackendAiResult =
  | { ok: true; text: string; model: string }
  | { ok: false; error: string };

type SubmitCompleteResponse = {
  status?: boolean;
  message?: string;
  data?: { uuid?: string; status?: string };
};

type PollCompleteResponse = {
  status?: boolean;
  message?: string;
  data?: { uuid?: string; status?: string; text?: string; model?: string; error?: string };
};

const AI_POLL_INTERVAL_MS = 30_000;
const AI_MAX_POLL_ATTEMPTS = 20;

function readAbortMessage(signal?: AbortSignal) {
  const reason = signal?.reason;
  return reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "AI 请求已取消。";
}

async function pollResult(uuid: string, signal?: AbortSignal): Promise<BackendAiResult | { ok: false; retry: true }> {
  const response = await fetch(`${getBackendApiBaseUrl()}/ai/v1/complete/result?uuid=${encodeURIComponent(uuid)}`, {
    method: "GET",
    headers: {
      "xhs-language": "zh-cn"
    },
    signal
  });

  const json = (await response.json().catch(() => ({}))) as PollCompleteResponse;
  const result = json.data;

  if (!response.ok || !json.status || !result?.status) {
    return { ok: false, error: json.message || "AI 结果查询失败。" };
  }

  if (result.status === "pending") {
    return { ok: false, retry: true };
  }

  if (result.status === "failed") {
    return { ok: false, error: result.error || json.message || "AI 调用失败。" };
  }

  if (result.status !== "completed" || !result.text) {
    return { ok: false, error: "AI 返回结果不完整。" };
  }

  return {
    ok: true,
    text: result.text,
    model: result.model || ""
  };
}

async function waitForNextPoll(ms: number, signal?: AbortSignal) {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      cleanup();
      reject(new Error(readAbortMessage(signal)));
    };

    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    };

    if (signal?.aborted) {
      cleanup();
      reject(new Error(readAbortMessage(signal)));
      return;
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

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

    const json = (await response.json().catch(() => ({}))) as SubmitCompleteResponse;
    const uuid = json.data?.uuid?.trim();

    if (!response.ok || !json.status || !uuid) {
      return { ok: false, error: json.message || "AI 任务提交失败。" };
    }

    for (let attempt = 0; attempt < AI_MAX_POLL_ATTEMPTS; attempt += 1) {
      await waitForNextPoll(AI_POLL_INTERVAL_MS, input.signal);
      const polled = await pollResult(uuid, input.signal);
      if (polled.ok) return polled;
      if ("retry" in polled) {
        if (attempt === AI_MAX_POLL_ATTEMPTS - 1) {
          return { ok: false, error: "AI 处理超时，请稍后重试。" };
        }
        continue;
      }
      return polled;
    }

    return { ok: false, error: "AI 处理超时，请稍后重试。" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "AI 接口调用失败。" };
  }
}
