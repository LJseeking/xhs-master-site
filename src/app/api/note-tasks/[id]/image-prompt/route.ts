import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { accountVisualMode, buildCompactImageStyleBrief, buildImagePrompt, buildImageStyleStudy, isWeddingAccount } from "@/lib/imagePrompts";
import { styleBriefFromStudy } from "@/lib/imageStyleStudy";
import { slugifyAccountName } from "@/lib/fsPaths";
import { formatExpertRulesForPrompt } from "@/lib/expertLearning";

function q(value: string) {
  return JSON.stringify(value);
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

export async function POST(request: Request, context: { params: { id: string } }) {
  const id = Number(context.params.id);
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

  const latestReference = account.referenceResearches?.[0];
  const latestImageStudy = account.imageStyleStudies?.[0];
  const imageStyleStudy = latestImageStudy?.summaryMarkdown || buildImageStyleStudy(account, latestReference);
  const styleBrief = styleBriefFromStudy(latestImageStudy);
  const fallbackBrief = buildCompactImageStyleBrief(account, latestReference);

  const promptDir = path.join(process.cwd(), "prompts", slugifyAccountName(account.name));
  await fs.mkdir(promptDir, { recursive: true });
  const imagePromptFile = path.join("prompts", slugifyAccountName(account.name), `note-${noteTask.id}-image.md`);
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
  await fs.writeFile(path.join(process.cwd(), imagePromptFile), content, "utf8");

  const base = "uv run xiaohongshu_auto_op";
  const accountFlag = `--account ${q(account.accountParam)}`;
  const copy = commandCopy(account);
  const commands =
    imageSourceMode === "ai_generate"
      ? [
          {
            category: "按笔记内容生成 AI 辅助图方案",
            command: `${base} xhs-content-ops draft-note --prompt-file ${q(imagePromptFile)} ${accountFlag} --safe-mode`,
            description: "根据这篇笔记内容生成信息卡、结构说明、低拟真辅助画面和必要的图片提示词；不调用真实案例素材。",
            safetyNote: "AI 辅助图不得伪装成真实案例、真实现场或真实客户反馈；对外图片、标题、正文和图注不标注来源说明。"
          }
        ]
      : imageSourceMode === "remote_images"
        ? [
            {
              category: "用指定图片生成单篇方案",
              command: `${base} xhs-creative image2 --prompt-file ${q(imagePromptFile)} --output-dir ${q(account.assetsPath)} ${accountFlag}`,
              description: "按用户指定的远程图片 URL 生成封面、图集顺序、图上文字和必要的 image2 轻处理提示。",
              safetyNote: copy.safety
            }
          ]
        : [
            {
              category: "让龙虾读取远程图片 URL",
              command: `${base} xhs-content-ops draft-note --prompt-file ${q(imagePromptFile)} ${accountFlag} --safe-mode`,
              description: "根据这篇笔记内容读取远程图片 URL，自动挑出最匹配主题的图片，并生成图集顺序、正文和风险核验。",
              safetyNote: copy.safety
            }
          ];

  return NextResponse.json({
    imagePrompt: {
      title: `${noteTask.topicTitle} 图片 Prompt`,
      content,
      path: imagePromptFile
    },
    referenceStyle: imageStyleStudy,
    commands
  });
}
