import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getLlmStatus } from "@/lib/llm";

const execFileAsync = promisify(execFile);

export async function getSystemHealth() {
  const llm = getLlmStatus();
  let uvAvailable = false;
  let uvVersion = "";
  try {
    const result = await execFileAsync("uv", ["--version"]);
    uvAvailable = true;
    uvVersion = result.stdout.trim();
  } catch {
    uvVersion = "uv 不可用";
  }

  return {
    mode: "Prompt + Command only",
    llm,
    uv: { available: uvAvailable, version: uvVersion },
    recentFailures: [],
    diagnostics: [
      "当前网站不会执行真实发布、评论、点赞、收藏或私信。",
      uvAvailable ? `uv 可用：${uvVersion}` : "uv 不可用，请安装 uv 后再复制命令执行。",
      llm.enabled ? `AI 服务可用，标识：${llm.model}` : "AI 服务不可用，将使用内置模板生成。",
      "当前内容会自动保留在工作区，继续使用时可直接接着操作。"
    ]
  };
}
