import type { Account, AccountImageStyleStudy } from "@prisma/client";
import { accountVisualMode, buildCompactImageStyleBrief, buildImageStyleStudy, isWeddingAccount, type AccountVisualMode } from "@/lib/imagePrompts";

function q(value: string) {
  return JSON.stringify(value);
}

const imageStudyCopy: Record<AccountVisualMode, {
  keywords: string[];
  goal: string;
  observations: string[];
  riskLine: string;
}> = {
  culture_tourism: {
    keywords: ["文旅", "景区", "街区", "古镇", "目的地", "游览动线", "票务", "活动", "小红书"],
    goal: "在小红书 App 中搜索同类型文旅目的地、景区、街区、古镇和城市文旅账号，专门研究“目的地图、动线图、活动现场图和服务信息卡为什么让人想点开、收藏、继续看”。重点看文旅项目如何把漂亮图片转成出行决策。",
    observations: ["封面底图：真实地标、活动现场、空镜、拼图、信息卡哪类更常见。", "封面标题：地点、时间、人群、节庆、收藏理由如何表达。", "图集结构：是否能压缩为封面体验、游览动线、核心看点、交通票务、互动卡。", "真实感：导览图、票务截图、交通、服务点、活动日期和现场细节。", "收藏点：路线、停车、厕所、票价、开放时间、亲子/拍照/避坑信息。", "不适合借鉴的套路：硬广、过度滤镜、伪造人流、活动时间不清。"],
    riskLine: "7. 风险提醒：哪些 AI 图、网络图、活动图不能伪装成真实目的地、真实活动或真实开放状态"
  },
  heritage: {
    keywords: ["非遗", "民俗", "传统文化", "手作", "传承人", "节庆", "体验", "研学", "小红书"],
    goal: "在小红书 App 中搜索同类型民俗/非遗/传统文化体验账号，专门研究“工艺细节、活动现场、体验流程和预约信息卡为什么让人想收藏和报名”。重点看如何既有吸引力又尊重文化语境。",
    observations: ["封面底图：工艺细节、作品、传承人、活动现场、体验过程哪类更常见。", "封面标题：工艺名、地点、体验感、亲子/研学如何表达。", "图集结构：是否能压缩为封面工艺、制作流程、人物故事、体验预约、尊重禁忌。", "真实感：材料、工具、作品来源、活动日期、肖像授权和场地信息。", "收藏点：怎么预约、适合谁、价格、时间、禁忌、拍照边界。", "不适合借鉴的套路：猎奇化、符号滥用、伪造传承人、过度 AI 感。"],
    riskLine: "7. 风险提醒：哪些图片不能伪装成真实传承人、真实仪式、真实作品或已授权肖像"
  },
  stay: {
    keywords: ["民宿", "酒店", "露营地", "房型", "窗景", "周边游", "亲子", "宠物友好", "小红书"],
    goal: "在小红书 App 中搜索同类型民宿、酒店、露营地账号，研究“房间图、窗景图、设施图、周边体验和价格预订卡为什么让人想收藏和咨询”。",
    observations: ["封面底图：房间、窗景、泳池/营地、公共区、周边景点哪类更常见。", "封面标题：地点、房型、价格、适合人群、节假日如何表达。", "图集结构：是否能压缩为封面空间、房型设施、周边体验、价格预订、FAQ。", "真实感：房间结构、设施、停车、宠物/亲子政策、价格房态。", "收藏点：预算、交通、早餐、周边玩法、入住避坑。", "不适合借鉴的套路：伪造房型、夸大景观、盗用客图、价格不明。"],
    riskLine: "7. 风险提醒：哪些 AI 空间图不能伪装成真实房型、真实景观或真实房态"
  },
  food: {
    keywords: ["菜品", "环境", "菜单", "信息卡", "餐厅", "本地生活", "小红书"],
    goal: "在小红书 App 中搜索同类型餐饮账号和爆款图文笔记，专门研究“菜品图、环境图和信息卡为什么让人想点开、收藏、继续看”。",
    observations: ["封面底图：真实菜品、环境、菜单截图、拼图、信息卡哪类更常见。", "封面标题：菜名、人均、商圈、场景和利益点如何表达。", "图集结构：是否能压缩为封面菜品、菜品卖点、环境场景、菜单套餐、评论互动。", "真实感：菜品实拍、环境实拍、菜单、门头、包间、制作细节。", "收藏点：价格/人均、套餐组成、点单建议、预约规则、包间/停车/营业时间。", "不适合借鉴的套路：硬广、过度滤镜、盗图感、伪造体验、信息太密。"],
    riskLine: "7. 风险提醒：哪些 AI 图、网络图、顾客图不能伪装成真实菜品或真实门店"
  },
  outdoor: {
    keywords: ["路线", "轨迹", "路况", "风景", "装备", "信息卡", "徒步", "骑行", "小红书"],
    goal: "在小红书 App 中搜索同类型户外路线账号和爆款图文笔记，专门研究“路线图、轨迹截图、现场图和信息卡为什么让人想点开、收藏、继续看”。",
    observations: ["封面底图：真实照片、AI 示意图、截图、拼图、信息卡哪类更常见。", "封面标题：路线名、距离、难度、地点、人群标签如何表达。", "图集结构：是否能压缩为封面现场、路线轨迹、关键路况、风景情绪、装备/注意事项。", "真实感：现场实拍、轨迹截图、地图、路标、岔路、补给点、交通截图和装备实拍。", "收藏点：距离/爬升、难度、交通、补给、天气、开放状态、装备清单、适合人群。", "不适合借鉴的套路：硬广、过度滤镜、盗图感、伪造体验、信息太密。"],
    riskLine: "7. 风险提醒：哪些 AI 图、网络图、资料图不能伪装成真实现场、真实路线或亲历经历"
  },
  museum: {
    keywords: ["博物馆", "展览", "展厅", "展品", "研学", "亲子", "预约", "票务", "小红书"],
    goal: "在小红书 App 中搜索同类型博物馆、展览、研学账号，研究“展品图、展厅图、观展动线和预约票务卡为什么让人想收藏”。",
    observations: ["封面底图：展品、展厅、展览海报、亲子活动、信息卡哪类更常见。", "封面标题：展名、展期、适合人群、看点如何表达。", "图集结构：是否能压缩为封面展品、观展动线、展品故事、预约票务、研学互动。", "真实感：展期、票务、拍摄规则、导览图、展品授权。", "收藏点：预约方式、展期、讲解、亲子年龄、拍照限制。", "不适合借鉴的套路：违反拍摄规则、伪造馆藏、盗用展品图。"],
    riskLine: "7. 风险提醒：哪些展品图、海报图、AI 图不能伪装成真实授权展品或真实展期"
  },
  product: {
    keywords: ["特产", "文创", "伴手礼", "产品", "包装", "产地", "礼盒", "工艺", "小红书"],
    goal: "在小红书 App 中搜索同类型地域特产、文创、伴手礼账号，研究“产品图、产地工艺图、使用场景和规格价格卡为什么让人想收藏和购买”。",
    observations: ["封面底图：产品、包装、礼盒、产地、使用场景哪类更常见。", "封面标题：产品名、产地、送礼/自用、价格如何表达。", "图集结构：是否能压缩为封面产品、原料工艺、使用送礼、规格价格、FAQ。", "真实感：包装、规格、产地、原料、制作过程、资质。", "收藏点：价格、规格、保存、物流、适合送谁。", "不适合借鉴的套路：夸大功效、伪造产地、虚构销量库存。"],
    riskLine: "7. 风险提醒：哪些图片不能伪装成真实产品、真实产地、真实规格或真实资质"
  },
  service: {
    keywords: ["本地服务", "门店", "服务流程", "案例", "预约", "价格", "设备", "资质", "小红书"],
    goal: "在小红书 App 中搜索同类型本地生活服务账号，研究“服务空间、流程图、设备资质和价格预约卡为什么让人产生信任和咨询”。",
    observations: ["封面底图：服务结果、门店空间、流程细节、设备、案例哪类更常见。", "封面标题：服务项目、痛点、适合人群、价格如何表达。", "图集结构：是否能压缩为封面服务、流程细节、设备资质、价格预约、FAQ。", "真实感：服务流程、资质、工具、授权案例、隐私处理。", "收藏点：价格、周期、预约、禁忌、适合/不适合谁。", "不适合借鉴的套路：夸大效果、伪造案例、泄露隐私、无资质承诺。"],
    riskLine: "7. 风险提醒：哪些案例图、前后对比、AI 图不能伪装成真实授权案例或真实效果"
  }
};

const weddingImageStudyCopy = {
  keywords: ["婚礼", "婚庆", "备婚", "婚礼策划", "婚礼布置", "婚礼蛋糕", "花艺", "仪式区", "迎宾区", "甜品台", "小红书"],
  goal: "在小红书 App 中搜索同类型婚礼公司、婚礼策划、婚礼布置和备婚灵感爆款图文，专门研究“婚礼图片里的细节如何被拆成高收藏笔记”。重点看婚礼蛋糕、花艺、仪式区、迎宾区、桌花、席位卡、甜品台、灯光布幔等细节如何命名、如何写标题、如何引导新人咨询。",
  observations: [
    "封面底图：蛋糕、花艺、仪式区、迎宾区、桌花、甜品台、场布全景哪类更容易获得点击。",
    "封面标题：细节名、风格词、备婚情绪、收藏理由如何表达，例如“这个蛋糕真的太会抬高级感”。",
    "图集结构：是否能压缩为封面细节、场景关系、细节拆解、风格/预算信息卡、备婚 FAQ。",
    "图片识别方式：爆款文章如何从一张现场图里抓住蛋糕、花艺、纸品、灯光、材质、色系、动线等细节。",
    "正文风格：是否用第一人称/备婚口吻/审美点评/避坑提醒/清单式拆解，如何避免硬广。",
    "收藏点：适合什么风格、什么场地、什么预算段、什么季节、怎么和策划师沟通。",
    "不适合借鉴的套路：盗图感、堆砌高级词、无授权新人肖像、虚构价格档期、照搬爆款标题。"
  ],
  riskLine: "7. 风险提醒：哪些新人/宾客肖像、真实案例、价格档期、场地信息和 AI 图不能伪装成已授权真实婚礼案例"
};

function copyForAccount(account: Account) {
  return isWeddingAccount(account) ? weddingImageStudyCopy : imageStudyCopy[accountVisualMode(account.accountType)];
}

export function buildImageStyleKeywords(account: Account) {
  const copy = copyForAccount(account);
  const base = [
    account.city,
    account.contentDirections,
    account.targetUsers,
    account.painPoints,
    account.accountType,
    "封面",
    "图文",
    ...copy.keywords
  ]
    .join(" ")
    .replace(/[，。；、\n]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const unique = Array.from(new Set(base)).slice(0, 14);
  return unique.join(" / ");
}

export function buildImageStyleResearchPrompt(account: Account) {
  const copy = copyForAccount(account);
  return `# 给 xiaohongshu_auto_op skill 的图片风格研究 Prompt

## 当前执行模式
只读搜索和分析。不得发布、评论、点赞、收藏、关注或私信。

## 账号参数
--account ${account.accountParam}

## 研究目标
${copy.goal}

## 我方账号
- 账号名称：${account.name}
- 账号类型：${account.accountType}
- 城市：${account.city || "未填写"}
- 目标用户：${account.targetUsers || "未填写"}
- 内容方向：${account.contentDirections || "未填写"}
- 用户痛点：${account.painPoints || "未填写"}

## 搜索关键词
${buildImageStyleKeywords(account)}

## 请重点观察
${copy.observations.map((item, index) => `${index + 1}. ${item}`).join("\n")}

## 输出格式
请输出 Markdown：
1. 搜索过的关键词和命令摘要
2. 候选参考笔记/账号：标题或账号、URL、为什么值得参考
3. 图片风格共性：封面、图集、信息卡、色调、真实感
4. 高收藏图片结构：可复用的 5 张图默认模板，以及什么时候可以压缩为 4 张
5. 我方账号图片风格建议：适合采用什么，不适合采用什么
6. 可沉淀为单篇图片 Prompt 的短原则：4-6 条
${copy.riskLine}

## 约束
- 不要编造搜索不到的数据。
- 如果没有 URL 或明确截图观察，请标明“未获取到”。
- 只返回研究结果，不执行任何账号操作。`;
}

export function buildImageStyleCommands(account: Account) {
  const base = "uv run xiaohongshu_auto_op";
  const accountFlag = `--account ${q(account.accountParam)}`;
  const keyword = buildImageStyleKeywords(account);
  return [
    {
      category: "搜索同类型图片风格",
      command: `${base} xhs-explore search --keyword ${q(keyword)} ${accountFlag} --limit 30 --include-notes`,
      description: "只读搜索同类型图文笔记，重点观察封面和图集结构。",
      safetyNote: "只读搜索命令，不发布、不互动。"
    },
    {
      category: "查看参考笔记详情",
      command: `${base} xhs-explore note-detail --note-url ${q("粘贴参考笔记 URL")} ${accountFlag} --include-comments`,
      description: "查看具体笔记图集、标题和评论收藏点，辅助总结图片风格。",
      safetyNote: "只读详情命令，不评论、不点赞、不收藏。"
    },
    {
      category: "查看参考账号主页",
      command: `${base} xhs-explore user-profile --user-url ${q("粘贴参考账号主页 URL")} ${accountFlag} --include-notes --limit 20`,
      description: "观察账号长期封面统一性、系列视觉和图集模板。",
      safetyNote: "只读主页命令，不关注、不私信。"
    }
  ];
}

export function summarizeImageStyleStudyFallback(account: Account, rawResults: string) {
  const synthetic = {
    contentFeatures: rawResults,
    summaryMarkdown: rawResults,
    selectedAccounts: "",
    rawResults
  };
  const summaryMarkdown = buildImageStyleStudy(account, synthetic);
  const styleBrief = buildCompactImageStyleBrief(account, synthetic);
  return { summaryMarkdown, styleBrief };
}

export function styleBriefFromStudy(study: Pick<AccountImageStyleStudy, "styleBriefJson" | "summaryMarkdown"> | null | undefined) {
  if (!study) return [];
  try {
    const parsed = JSON.parse(study.styleBriefJson || "[]");
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, 8);
  } catch {
    // Fall through to summary-derived fallback.
  }
  return study.summaryMarkdown
    .split("\n")
    .map((line) => line.replace(/^[-#\s]+/, "").trim())
    .filter((line) => line.length >= 8 && line.length <= 90)
    .slice(0, 8);
}
