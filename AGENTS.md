# 项目开发约束

## OpenClaw 小红书 Skill 集成

- `xiaohongshu_auto_op` skill 的本地参考目录是：`/Users/daniel/Code/10_project/PowerMatrix/openclaw_skillhub/xiaohongshu_auto/xiaohongshu-auto-op`。
- 开发或修改 OpenClaw 小红书任务、CLI 命令和参数时，必须先核对该目录中的 `SKILL.md`、对应子技能文档和 `scripts/cli.py`，以实际实现为准，不得自行假设命令。
- `xhs-master-site` 是在线服务，不得假设 OpenClaw 机器能够访问本站服务器上的本地 Prompt 文件或本地素材目录；跨机器素材应使用可访问 URL，并在任务中要求 OpenClaw 下载到本机后再执行 skill。
