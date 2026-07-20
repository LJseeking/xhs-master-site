import { NextResponse } from "next/server";
import { accountVisualMode, buildCompactImageStyleBrief, buildImagePrompt, buildImageStyleStudy, isWeddingAccount } from "@/lib/imagePrompts";
import { styleBriefFromStudy } from "@/lib/imageStyleStudy";
import { formatExpertRulesForPrompt } from "@/lib/expertLearning";

function nonEmptyLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\"'\"'`)}'`;
}

function buildOpenclawTask(input: {
  account: { name: string; accountParam: string };
  noteTask: { id: number; topicTitle: string };
  imageSourceMode: string;
  openclawImagePaths: string;
  prompt: string;
}) {
  const { account, noteTask, imageSourceMode, openclawImagePaths, prompt } = input;
  const taskName = `xhs-image-task-${noteTask.id}`;
  const accountName = shellQuote(account.accountParam);
  const imageSources = nonEmptyLines(openclawImagePaths);
  const sourceList = imageSources.length
    ? imageSources.map((source, index) => `${index + 1}. ${source}`).join("\n")
    : "未提供；按具体要求确认需要生成的辅助图片。";
  const usesExistingImages = imageSourceMode !== "ai_generate";
  const command = usesExistingImages
    ? `uv run python scripts/cli.py edit-image \\
  --prompt "$IMAGE_PROMPT" \\
  --images "$INPUT_IMAGE" \\
  --output-dir "$ACCOUNT_ASSETS_DIR" \\
  --size "1024x1536" \\
  --quality "medium" \\
  --input-fidelity "high"`
    : `uv run python scripts/cli.py generate-image \\
  --prompt "$IMAGE_PROMPT" \\
  --output-dir "$ACCOUNT_ASSETS_DIR" \\
  --size "1024x1536"`;
  const sourceSteps = imageSourceMode === "remote_images"
    ? `1. 进入已安装的 xiaohongshu_auto_op skill 根目录。
2. 设置 \`ACCOUNT_NAME=${accountName}\`、\`TASK_DIR="$PWD/.openclaw_tasks/${taskName}"\`、\`ACCOUNT_ASSETS_DIR="$PWD/assets/$ACCOUNT_NAME"\`，然后创建 \`$TASK_DIR/assets\` 和 \`$ACCOUNT_ASSETS_DIR\`。
3. 下载“指定图片”中的全部 URL 到 \`$TASK_DIR/assets\`，保留原始扩展名，并取得每张图片的本地绝对路径。只允许使用这些指定图片，不得扫描或替换为其他素材。
4. 阅读下方完整要求，先确定图集顺序以及每张图对应的单张 \`IMAGE_PROMPT\`。每次把当前图片的本地绝对路径设置为 \`INPUT_IMAGE\`，执行一次图片编辑命令；需要多张成品时必须逐张执行。`
    : `1. 进入已安装的 xiaohongshu_auto_op skill 根目录。
2. 设置 \`ACCOUNT_NAME=${accountName}\`、\`TASK_DIR="$PWD/.openclaw_tasks/${taskName}"\`、\`ACCOUNT_ASSETS_DIR="$PWD/assets/$ACCOUNT_NAME"\`，然后创建 \`$TASK_DIR\` 和 \`$ACCOUNT_ASSETS_DIR\`。
3. 阅读下方完整要求，先确定每张辅助图对应的单张 \`IMAGE_PROMPT\`，再逐张执行图片生成命令。`;

  return {
    title: `${noteTask.topicTitle} OpenClaw 图片执行任务`,
    command,
    content: `# OpenClaw 图片执行任务

请使用 **xiaohongshu_auto_op** 的 **xhs-creative** skill 完成本篇配图，不要使用其他图片工具。

## 任务上下文
- 业务账号：${account.name}
- 账号参数：${account.accountParam}
- 单篇任务：${noteTask.topicTitle}
- 图片来源模式：${imageSourceMode}

注意：\`${account.accountParam}\` 是 xiaohongshu_auto_op 的账号键。\`edit-image\` / \`generate-image\` 不依赖小红书浏览器登录账号，因此不要把它作为 \`--account\` 传给 CLI；但所有成品图必须保存到该账号的 \`assets/${account.accountParam}/\` 素材目录。

## 指定图片
${sourceList}

## 执行步骤
${sourceSteps}

## 必须使用的 CLI 命令

\`IMAGE_PROMPT\` 必须替换为当前单张图片对应的编辑/生成提示词；\`INPUT_IMAGE\` 必须替换为 OpenClaw 下载或选择后的本地绝对路径。

\`\`\`bash
${command}
\`\`\`

完成后必须确认每张成品图都位于 \`$ACCOUNT_ASSETS_DIR\`，再按图文发布顺序，把这些成品图的本地绝对路径逐行写入 \`$TASK_DIR/image-paths.txt\`。清单中不得写入任务临时目录或其他账号目录中的图片。同时返回每张成品图的 \`local_path\`、对应原图、实际使用的 Prompt 和失败项。不要发布小红书内容。

## 具体要求

${prompt}`
  };
}

function commandCopy(account: { accountType: string; name: string; personaBase: string; contentDirections: string; materialCondition: string; businessGoals: string; targetUsers: string }) {
  if (isWeddingAccount(account)) {
      return {
        source: "填写婚礼远程图片 URL",
        image2: "让龙虾直接读取婚礼远程图片 URL，先识别婚礼蛋糕、花艺、仪式区、迎宾区、桌花、席位卡、灯光布幔等细节，再根据逐张 Prompt 生成细节拆解图和信息卡。",
        draftCategory: "调用已有婚礼图片做细节拆解",
        draft: "读取婚礼远程图片 URL，先判断每张图片可写成什么小红书选题，再围绕一个高收藏细节规划图集和正文。",
      safety: "命令只作建议；确保婚礼案例、新人/宾客肖像、场地、价格、档期和套餐信息授权清楚且人工核验。"
    };
  }
  const accountType = account.accountType;
  const mode = accountVisualMode(accountType);
  const copies = {
    culture_tourism: {
      source: "填写目的地/活动远程图片 URL",
      image2: "让龙虾直接读取文旅远程图片 URL，根据逐张 image2 Prompt 生成目的地图生图、动线图和服务信息卡底图。",
      draftCategory: "调用已有文旅素材改图",
      draft: "读取远程图片 URL，优先识别真实目的地图、活动现场图、导览图和票务截图，再规划图生图、信息卡和图集顺序。",
      safety: "命令只作建议；确保这些素材真实存在、来源清楚、授权可用，开放时间、票价和活动日期需要人工核验。"
    },
    heritage: {
      source: "填写民俗/非遗远程图片 URL",
      image2: "让龙虾直接读取民俗非遗远程图片 URL，根据逐张 image2 Prompt 生成工艺细节图生图、流程图和体验预约信息卡。",
      draftCategory: "调用已有民俗/非遗素材改图",
      draft: "读取远程图片 URL，优先识别真实工艺、作品、活动现场和授权人物图，再规划图生图、信息卡和图集顺序。",
      safety: "命令只作建议；确保肖像、作品和活动素材授权清楚，文化禁忌和表达边界需要人工核验。"
    },
    stay: {
      source: "填写房型/空间远程图片 URL",
      image2: "让龙虾直接读取住宿远程图片 URL，根据逐张 image2 Prompt 生成空间轻处理、设施说明和价格预订信息卡。",
      draftCategory: "调用已有住宿素材改图",
      draft: "读取远程图片 URL，优先识别真实房型、窗景、公共区、周边体验和价格政策截图，再规划图集顺序。",
      safety: "命令只作建议；确保房型、景观、价格、房态和政策都需要人工核验。"
    },
    food: {
      source: "填写餐厅远程图片 URL",
      image2: "让龙虾直接读取餐厅远程图片 URL，优先按文件名识别菜品和环境，生成主推菜图生图、环境轻处理和交通指南漫画/信息卡。",
      draftCategory: "调用已有餐厅图片改图",
      draft: "读取远程图片 URL，要求链接文件名尽量是菜品名、环境名或交通节点名，再按“前几张菜品、后面环境、最后交通漫画卡”的惯例规划图集。",
      safety: "命令只作建议；确保图片真实存在、来源清楚且授权可用，菜品、活动、价格和交通信息需要人工核验。"
    },
    outdoor: {
      source: "填写路线/现场远程图片 URL",
      image2: "让龙虾直接读取路线/现场远程图片 URL，根据逐张 image2 Prompt 生成现场图生图、路况轻处理和信息卡底图。",
      draftCategory: "调用已有路线/现场图片改图",
      draft: "读取远程图片 URL，优先识别真实现场图、路线图和轨迹截图，再规划图生图、轻处理和图集顺序。",
      safety: "命令只作建议；确保这些图片真实存在、来源清楚、授权可用，路线信息需要人工核验。"
    },
    museum: {
      source: "填写展品/展厅远程图片 URL",
      image2: "让龙虾直接读取展馆研学远程图片 URL，根据逐张 image2 Prompt 生成展品图轻处理、观展动线和预约票务信息卡。",
      draftCategory: "调用已有展馆/研学素材改图",
      draft: "读取远程图片 URL，优先识别真实展品授权图、展厅图、导览图和票务截图，再规划图集顺序。",
      safety: "命令只作建议；确保展期、票务、拍摄规则和展品版权需要人工核验。"
    },
    product: {
      source: "填写产品/包装远程图片 URL",
      image2: "让龙虾直接读取产品远程图片 URL，根据逐张 image2 Prompt 生成产品图生图、工艺场景和规格价格信息卡。",
      draftCategory: "调用已有产品/文创素材改图",
      draft: "读取远程图片 URL，优先识别真实产品、包装、产地、原料和规格价格图，再规划图集顺序。",
      safety: "命令只作建议；确保产地、规格、价格、库存、资质和授权需要人工核验。"
    },
    service: {
      source: "填写服务/空间远程图片 URL",
      image2: "让龙虾直接读取本地服务远程图片 URL，根据逐张 image2 Prompt 生成服务流程图、设备资质图和价格预约信息卡。",
      draftCategory: "调用已有本地服务素材改图",
      draft: "读取远程图片 URL，优先识别真实空间、服务流程、设备资质和授权案例，再规划图集顺序。",
      safety: "命令只作建议；确保案例授权、隐私、价格、资质和效果表达需要人工核验。"
    }
  };
  return copies[mode];
}

export async function POST(request: Request, _context: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const openclawImagePaths = String(body.openclawImagePaths || "");
  const imageSourceMode = ["ai_generate", "remote_images"].includes(String(body.imageSourceMode))
    ? String(body.imageSourceMode)
    : "remote_images";
  const noteContent = String(body.noteContent || "");
  const singleGoal = String(body.singleGoal || "");
  const imageCount = String(body.imageCount || "");
  const noteTask = body.noteTask;
  const account = body.account;
  if (!noteTask || !account) return NextResponse.json({ error: "缺少任务上下文" }, { status: 400 });
  if (!String(account.accountParam || "").trim()) {
    return NextResponse.json({ error: "当前账号未配置 OpenClaw skill 账号参数，无法确定账号素材目录。" }, { status: 400 });
  }
  const remoteImageUrls = nonEmptyLines(openclawImagePaths);
  if (imageSourceMode === "remote_images" && (!remoteImageUrls.length || remoteImageUrls.some((url) => !/^https?:\/\//i.test(url)))) {
    return NextResponse.json({ error: "请选择至少一张带完整 HTTP(S) 链接的图片。" }, { status: 400 });
  }

  const latestReference = account.referenceResearches?.[0];
  const latestImageStudy = account.imageStyleStudies?.[0];
  const imageStyleStudy = latestImageStudy?.summaryMarkdown || buildImageStyleStudy(account, latestReference);
  const styleBrief = styleBriefFromStudy(latestImageStudy);
  const fallbackBrief = buildCompactImageStyleBrief(account, latestReference);

  const content = buildImagePrompt({
    account,
    noteTask,
    styleBrief: styleBrief.length ? styleBrief : fallbackBrief,
    openclawImagePaths,
    imageSourceMode,
    noteContent,
    singleGoal,
    imageCount,
    expertRules: formatExpertRulesForPrompt(account.expertRules || [])
  });
  const copy = commandCopy(account);
  const openclawTask = buildOpenclawTask({
    account,
    noteTask,
    imageSourceMode,
    openclawImagePaths,
    prompt: content
  });
  const category = imageSourceMode === "ai_generate"
    ? "生成 AI 辅助图"
    : "用远程图片生成单篇配图";
  const commands = [
    {
      category,
      command: openclawTask.command,
      description: "由 OpenClaw 在 xiaohongshu_auto_op skill 目录中准备本地图片，并按单张 Prompt 逐次执行真实 CLI。",
      safetyNote: imageSourceMode === "ai_generate"
        ? "AI 辅助图不得伪装成真实案例、真实现场或真实客户反馈。"
        : copy.safety
    }
  ];

  return NextResponse.json({
    openclawTask: {
      title: openclawTask.title,
      content: openclawTask.content
    },
    imagePrompt: {
      title: `${noteTask.topicTitle} 图片要求`,
      content,
      path: ""
    },
    referenceStyle: imageStyleStudy,
    commands
  });
}
