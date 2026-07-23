import type { Account, NoteTask } from "@/types/domain";

function q(value: string) {
  return JSON.stringify(value);
}

export function buildCommandSuggestions(account: Account, noteTask?: NoteTask | null, paths?: { promptFile?: string; imagePromptFile?: string }) {
  const base = `uv run xiaohongshu_auto_op`;
  const accountFlag = `--account ${q(account.accountParam)}`;
  const title = noteTask?.topicTitle ?? account.accountType;
  const keyword = `${account.accountType} ${title}`;
  const promptFile = paths?.promptFile || (noteTask ? `prompts/${account.name}/note-${noteTask.id}.md` : `profiles/${account.name}/AGENTS.md`);
  const imagePromptFile = paths?.imagePromptFile || (noteTask ? `prompts/${account.name}/note-${noteTask.id}-image.md` : promptFile);

  return [
    {
      category: "检查登录状态",
      command: `${base} xhs-auth status ${accountFlag}`,
      description: "确认当前账号 cookies 和登录态。",
      safetyNote: "只读检查，可执行；本网站仍只展示命令。"
    },
    {
      category: "搜索竞品/关键词",
      command: `${base} xhs-explore search --keyword ${q(keyword)} ${accountFlag} --limit 20`,
      description: "拉取同类选题与评论，用于人工分析标题、封面和用户痛点。",
      safetyNote: "只读探索，不互动。"
    },
    {
      category: "生成封面/配图",
      command: `${base} xhs-creative seedream --prompt-file ${q(imagePromptFile)} --output-dir ${q(account.assetsPath)} ${accountFlag}`,
      description: "使用单独图片 Prompt 生成封面图和图集示意图。",
      safetyNote: "只生成素材建议或拟真底图，需人工确认授权和内部真实性备注；不要把 AI 来源说明加到图片画面上。"
    },
    {
      category: "图文草稿命令",
      command: `${base} xhs-content-ops draft-note --prompt-file ${q(promptFile)} --assets-dir ${q(account.assetsPath)} ${accountFlag} --safe-mode`,
      description: "生成图文笔记草稿。",
      safetyNote: "只生成草稿，不发布。"
    },
    {
      category: "视频草稿命令",
      command: `${base} xhs-content-ops draft-video --prompt-file ${q(promptFile)} --assets-dir ${q(account.assetsPath)} ${accountFlag} --safe-mode`,
      description: "生成短视频脚本、首帧图与镜头建议。",
      safetyNote: "只生成草稿，不上传。"
    },
    {
      category: "发布命令建议",
      command: `${base} xhs-publish image-note --draft-file ${q(`drafts/${account.name}/note-${noteTask?.id ?? "ID"}.md`)} ${accountFlag}`,
      description: "发布图文笔记的参数建议。",
      safetyNote: "高风险真实账号操作：不得由本网站执行，必须人工复制、检查、确认。"
    },
    {
      category: "清理 cookies",
      command: `${base} xhs-auth clear-cookies ${accountFlag}`,
      description: "清理当前 account 的本地 cookies。",
      safetyNote: "会影响登录状态，执行前确认账号参数。"
    }
  ];
}
