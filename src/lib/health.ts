import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { prisma } from "@/lib/prisma";
import { getLlmStatus } from "@/lib/llm";

const execFileAsync = promisify(execFile);

async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readHead(p: string, max = 1200) {
  try {
    const text = await fs.readFile(p, "utf8");
    return text.slice(0, max);
  } catch {
    return "未找到或无法读取。";
  }
}

export async function getSystemHealth() {
  const root = process.cwd();
  const xhsPath = process.env.XHS_AUTO_OP_PATH || "../xiaohongshu_auto_op";
  const memoryPath = process.env.XHS_MEMORY_PATH || path.join(xhsPath, "MEMORY.md");
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

  const [profilesExists, assetsExists, memorySummary, recentLogs, accountCount, assetCount] = await Promise.all([
    exists(path.join(root, "profiles")),
    exists(path.join(root, "assets")),
    readHead(path.resolve(root, memoryPath)),
    prisma.systemLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.account.count(),
    prisma.asset.count()
  ]);

  return {
    mode: "Prompt + Command only",
    llm,
    xhsAutoOpPath: path.resolve(root, xhsPath),
    memoryPath: path.resolve(root, memoryPath),
    memorySummary,
    profiles: { exists: profilesExists, path: path.join(root, "profiles") },
    assets: { exists: assetsExists, path: path.join(root, "assets") },
    uv: { available: uvAvailable, version: uvVersion },
    counts: { accounts: accountCount, assets: assetCount },
    recentFailures: recentLogs.filter((log) => log.level === "error"),
    diagnostics: [
      "当前网站不会执行真实发布、评论、点赞、收藏或私信。",
      profilesExists ? "profiles 目录可用。" : "profiles 目录缺失。",
      assetsExists ? "assets 目录可用。" : "assets 目录缺失。",
      uvAvailable ? `uv 可用：${uvVersion}` : "uv 不可用，请安装 uv 后再复制命令执行。",
      llm.enabled ? `OpenAI API 已配置，模型：${llm.model}` : "OpenAI API 未配置，将使用内置模板生成。"
    ]
  };
}
