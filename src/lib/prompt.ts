import type { Account, AccountStrategy, NoteTask, WeeklyPlan } from "@prisma/client";
import { accountVisualMode, isWeddingAccount, type AccountVisualMode } from "@/lib/imagePrompts";

export function buildTaskPrompt(input: {
  account: Account;
  strategy: AccountStrategy | null;
  weeklyPlan: WeeklyPlan;
  noteTask: NoteTask;
  expertRules?: string;
}) {
  const { account, strategy, weeklyPlan, noteTask, expertRules } = input;
  const strategySummary = strategy?.positioning ?? `${account.name} ${account.accountType} 账号`;
  return buildModeTaskPrompt({ account, strategySummary, weeklyPlan, noteTask, expertRules });
}

function baseContext(input: {
  account: Account;
  strategySummary: string;
  weeklyPlan: WeeklyPlan;
  noteTask: NoteTask;
  imagePanelName: string;
  expertRules?: string;
}) {
  const { account, strategySummary, weeklyPlan, noteTask, imagePanelName, expertRules } = input;
  return `## 模式
生成可直接填写到小红书发布页的标题和正文，但只允许保存到草稿箱，严禁真实发布和互动。

## 账号参数
--account ${account.accountParam}

## 上下文
- 账号图片素材目录：assets/${account.accountParam}/
- 图片任务输出：.openclaw_tasks/xhs-image-task-${noteTask.id}/image-paths.txt
- 图片处理：先在“${imagePanelName}”完成图片任务；本阶段只读取其成品图片清单，不重新生成或替换图片。
- 账号定位：${strategySummary}
- 本周目标：${weeklyPlan.goal}

## 本篇笔记任务
- 标题方向：${noteTask.topicTitle}
- 内容类型：${noteTask.contentType}
- 目标用户：${noteTask.targetUser}
- 痛点：${noteTask.painPoint}
- 核心观点：${noteTask.coreView}
- 评论钩子：${noteTask.commentHook}
- 禁忌：${weeklyPlan.taboos || account.taboos || "遵守 AGENTS.md 禁区"}

## 已沉淀专家规则
${expertRules || "暂无已保存规则；按账号策划案和本篇任务生成。"}`;
}

const promptModeCopy: Record<AccountVisualMode, {
  title: string;
  imagePanelName: string;
  styleRules: string[];
  checkTitle: string;
}> = {
  culture_tourism: {
    title: "文旅目的地小红书笔记草稿 Prompt（发布精简版）",
    imagePanelName: "文旅图片创作",
    styleRules: [
      "这是文旅目的地发布稿，不是旅行社硬广，也不是完整旅游攻略。",
      "先讲为什么值得去，再讲怎么安排动线，最后讲交通、票务、开放时间和活动核验。",
      "现场图只讲真实出现的地点、活动和服务；导览/票务图只讲可核验的信息。",
      "不伪造亲历、活动现场、人流、票价、开放状态、游客反馈和商家承诺。"
    ],
    checkTitle: "发布前人工检查"
  },
  heritage: {
    title: "民俗非遗小红书笔记草稿 Prompt（发布精简版）",
    imagePanelName: "民俗非遗图片创作",
    styleRules: [
      "这是民俗/非遗体验发布稿，不是猎奇故事，也不是泛泛文化口号。",
      "先讲真实工艺/活动的体验感，再讲流程、故事和怎么预约，最后讲文化边界与人工核验。",
      "工艺图只讲真实作品、材料和步骤；人物图必须基于授权，不伪造传承人身份。",
      "不猎奇化民俗，不滥用族群/宗教符号，不伪造仪式、作品来源、活动现场和肖像授权。"
    ],
    checkTitle: "文化与授权检查"
  },
  stay: {
    title: "住宿/营地小红书笔记草稿 Prompt（发布精简版）",
    imagePanelName: "住宿图片创作",
    styleRules: [
      "这是民宿/酒店/营地发布稿，不是平台详情页复制，也不是夸张种草文。",
      "先讲适合什么入住场景，再讲房型空间、周边体验，最后讲价格房态、政策和预约提醒。",
      "空间图只讲真实房型、设施和景观；周边图只讲可确认的距离和体验。",
      "不伪造房型、景观、面积、房态、价格、退改、宠物/亲子政策和客人评价。"
    ],
    checkTitle: "入住前人工检查"
  },
  food: {
    title: "餐饮小红书笔记草稿 Prompt（发布精简版）",
    imagePanelName: "餐饮图片创作",
    styleRules: [
      "这是餐饮小红书发布稿，不是运营交付包，也不是大众点评长评。",
      "每篇必须先确定一个主轴：某个菜品、某个营销活动，或某个当地特色；不要一篇里散讲太多菜。",
      "正文先讲主推菜/活动/当地特色为什么值得来，再讲套餐或同行场景，最后讲环境、交通、预约、价格或到店提醒。",
      "图集默认 6 张：前 2-3 张讲当天主推菜或活动菜品，后 2 张讲餐厅内外环境，最后 1 张讲交通指南漫画/信息卡。",
      "菜品图只讲图里真实出现的菜；环境图只讲真实门店环境或适合场景；交通漫画只讲真实停车、路口、地标和到店路径。",
      "没有商家确认时，不写具体价格、人均、距离、营业时间、食材来源、停车承诺和活动优惠；用待确认/需商家确认替代。",
      "不伪造亲身探店、顾客评价、排队火爆、销量、优惠、食材等级和交通便利性。"
    ],
    checkTitle: "发布前人工检查"
  },
  outdoor: {
    title: "户外路线小红书笔记草稿 Prompt（发布精简版）",
    imagePanelName: "路线图片创作",
    styleRules: [
      "这是户外路线小红书发布稿，不是旅行社广告，也不是完整户外安全手册。",
      "先讲路线为什么值得走，再讲距离/爬升/难度，最后讲交通、补给、装备和安全核验。",
      "现场图只讲图里真实出现的风景、路况和季节；路线图只讲可核验的距离、爬升、起终点和节点。",
      "不伪造亲身经历、登顶、极端天气、轨迹数据、开放状态、救援风险和他人评价。"
    ],
    checkTitle: "出发前人工检查"
  },
  museum: {
    title: "展馆研学小红书笔记草稿 Prompt（发布精简版）",
    imagePanelName: "展馆研学图片创作",
    styleRules: [
      "这是博物馆/展览/研学发布稿，不是馆方公告复制，也不是泛泛打卡文。",
      "先讲展览为什么值得看，再讲展品/展厅故事和观展动线，最后讲展期、预约、票务和拍摄规则。",
      "展品图只讲真实展品和授权信息；导览图只讲可核验的参观路线。",
      "不伪造馆藏、展品来源、展期、票务、讲解员、观众评价和拍摄权限。"
    ],
    checkTitle: "展期与版权检查"
  },
  product: {
    title: "地域产品/文创小红书笔记草稿 Prompt（发布精简版）",
    imagePanelName: "产品文创图片创作",
    styleRules: [
      "这是地域特产/文创产品发布稿，不是电商详情页堆砌，也不是夸大功效文。",
      "先讲产品记忆点和适合场景，再讲产地/工艺/规格，最后讲价格、物流、保存和购买提醒。",
      "产品图只讲真实产品、包装和规格；工艺图只讲可核验的原料和制作过程。",
      "不伪造产地、销量、库存、功效、资质、用户评价和物流承诺。"
    ],
    checkTitle: "产品信息检查"
  },
  service: {
    title: "本地服务小红书笔记草稿 Prompt（发布精简版）",
    imagePanelName: "本地服务图片创作",
    styleRules: [
      "这是本地生活服务发布稿，不是夸张案例广告，也不是硬性成交话术。",
      "先讲用户痛点，再讲服务流程、设备/资质和适合人群，最后讲价格、预约和风险边界。",
      "流程图只讲真实服务步骤；案例图必须基于授权，不做夸张前后对比。",
      "不伪造顾客案例、效果、资质、价格、隐私授权和不可保证的结果。"
    ],
    checkTitle: "服务与授权检查"
  }
};

function buildModeTaskPrompt(input: {
  account: Account;
  strategySummary: string;
  weeklyPlan: WeeklyPlan;
  noteTask: NoteTask;
  expertRules?: string;
}) {
  const mode = accountVisualMode(input.account.accountType);
  const copy = promptModeCopy[mode];
  const imageCountLine = mode === "food" ? "图集默认 6 张" : "图集默认 5 张";
  const weddingRules = isWeddingAccount(input.account)
    ? [
        "这是婚礼公司小红书发布稿，图片是选题入口，不是只做服务介绍。",
        "必须先根据图集判断可写细节：婚礼蛋糕、甜品台、花艺、仪式区、迎宾区、桌花、席位卡、手捧花、灯光布幔、纸品、场地动线等。",
        "每篇只聚焦一个细节，把它写成备婚用户想收藏的风格灵感、落地判断或避坑笔记。",
        "参考同类型爆款文章的标题节奏、情绪表达、细节命名和收藏理由，但不得照搬原文或伪造数据。",
        "不能伪造新人反馈、真实案例授权、价格、档期、场地、花材成本和最终落地效果；未确认信息写待确认。"
      ]
    : [];
  return `# ${copy.title}

${baseContext({ ...input, imagePanelName: copy.imagePanelName })}

## 重要风格
- ${copy.styleRules.join("\n- ")}
${weddingRules.length ? `- ${weddingRules.join("\n- ")}\n` : ""}- 正文控制在 300-600 中文字；最多 6 个短段落。
- ${imageCountLine}；每张图必须对应正文里的一个句子。
- 语言自然、轻、像认真负责的账号运营者在帮用户做决策，不要像硬广。
- 如果图片不足，明确写“需要补拍/需基于真实素材图生图”，不要编造不存在的图片。

## 输出格式
只输出这些字段，保持简洁：
1. 标题候选 3 个
2. 最终标题 1 个
3. 封面文案 1 组（主标题 + 小字）
4. 正文发布稿（300-600 字）
5. 图集配文清单（${imageCountLine}，每张 1 行；必须写清对应图片内容）
6. 标签 5-6 个
7. 置顶评论 1 条
8. ${copy.checkTitle} 3 条

不要输出完整运营分析、详细发布建议、长篇图片说明或重复安全声明。`;
}
