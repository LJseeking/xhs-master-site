import type { Account, AccountReferenceResearch, NoteTask } from "@prisma/client";

export type AccountVisualMode = "culture_tourism" | "heritage" | "stay" | "food" | "outdoor" | "museum" | "product" | "service";

type VisualStrategy = {
  modeName: string;
  coverStyle: string;
  imageSetStyle: string;
  highEngagementRules: string[];
  avoid: string[];
};

const visualModeMap: Record<string, AccountVisualMode> = {
  cultural_tourism_destination: "culture_tourism",
  folk_custom_heritage: "heritage",
  homestay_hotel_camp: "stay",
  restaurant: "food",
  cafe_bakery: "food",
  hotpot_bbq_latenight: "food",
  bar_lightmeal: "food",
  hiking_diary: "outdoor",
  outdoor_travel: "outdoor",
  mountain_route: "outdoor",
  city_walk_nature: "outdoor",
  overseas_hiking: "outdoor",
  museum_exhibition_study: "museum",
  regional_product_cultural_creative: "product",
  wedding_planning: "service",
  local_life_service: "service"
};

export function accountVisualMode(accountType: string): AccountVisualMode {
  return visualModeMap[accountType] || "culture_tourism";
}

export function isHikingAccountType(accountType: string) {
  return accountVisualMode(accountType) === "outdoor";
}

export function isWeddingAccount(account: Pick<Account, "accountType" | "name" | "personaBase" | "contentDirections" | "materialCondition" | "businessGoals" | "targetUsers">) {
  if (account.accountType === "wedding_planning") return true;
  const text = [
    account.name,
    account.personaBase,
    account.contentDirections,
    account.materialCondition,
    account.businessGoals,
    account.targetUsers
  ].join(" ");
  return /婚礼|婚庆|婚宴|婚纱|婚摄|婚照|备婚|新娘|新郎|新人|婚礼策划|婚礼布置|宴会设计|仪式区|甜品台|迎宾区/.test(text);
}

const strategyByMode: Record<AccountVisualMode, VisualStrategy> = {
  culture_tourism: {
    modeName: "文旅目的地图文协同图集",
    coverStyle: "真实地标、街区、景区入口、活动现场或核心体验做视觉锚点，后期叠加地点、适合人群、时长和一个收藏理由。",
    imageSetStyle: "默认 5 张：封面地标/体验图、游览动线图、核心看点图、交通票务信息卡、评论互动卡。",
    highEngagementRules: ["地点识别度必须强", "动线和服务信息要能收藏", "活动日期、票务和交通必须可核验", "不要只有漂亮空镜"],
    avoid: ["不要伪造人流和活动现场", "不要把 AI 风景当真实目的地", "不要使用未授权游客肖像", "不要承诺未确认开放状态"]
  },
  heritage: {
    modeName: "民俗非遗图文协同图集",
    coverStyle: "真实工艺细节、作品质感、活动现场或体验过程做视觉锚点，后期叠加工艺/民俗名、地点和参与方式。",
    imageSetStyle: "默认 5 张：封面工艺/仪式图、制作流程图、人物/故事图、体验预约信息卡、尊重禁忌/互动卡。",
    highEngagementRules: ["手作细节和真实过程最能建立信任", "故事要尊重文化主体", "体验方式和时间地点要清楚", "肖像与作品授权要可确认"],
    avoid: ["不要猎奇化民俗", "不要伪造传承人和仪式", "不要滥用族群/宗教符号", "不要把 AI 作品当真实作品"]
  },
  stay: {
    modeName: "住宿空间图文协同图集",
    coverStyle: "真实房间、窗景、营地、公共区或周边体验做视觉锚点，后期叠加地点、房型/场景、预算或入住理由。",
    imageSetStyle: "默认 5 张：封面房间/景观图、房型设施图、周边体验图、价格预订信息卡、FAQ 互动卡。",
    highEngagementRules: ["房间和景观必须真实", "价格房态和政策要可核验", "周边体验能提升收藏", "亲子/宠物/停车信息要清楚"],
    avoid: ["不要伪造房型和景观", "不要改变空间大小和设施", "不要虚构房态价格", "不要盗用客人肖像"]
  },
  food: {
    modeName: "餐饮图文协同种草图集",
    coverStyle: "真实主推菜近景做视觉锚点，菜品占画面主体，保留真实颜色、分量、摆盘和关键食材；后期叠加菜名、当地特色/活动利益点、商圈或适合场景。",
    imageSetStyle: "默认 6 张：封面主推菜、主推菜细节、第二/第三道菜或套餐组合、门店内景/包间、门头/外部环境、交通指南漫画/信息卡。",
    highEngagementRules: ["主推菜必须一眼可见", "前几张固定讲当天主推菜或套餐，后几张固定讲环境和交通", "素材文件名尽量就是菜品名或环境名，方便龙虾按文件名识别", "真实菜品图优先，AI 只做补光、构图、背景和餐具氛围", "价格、套餐、活动、营业时间、停车和路线必须可核验，未确认内容标记待确认"],
    avoid: ["不要改变菜品关键食材和分量", "不要伪造顾客评价或排队火爆", "不要把 AI 环境图当作真实门店", "不要过度滤镜导致出品不一致"]
  },
  outdoor: {
    modeName: "户外路线图文协同图集",
    coverStyle: "真实徒步、骑行或户外现场图做视觉锚点，路线风景或关键路况占画面主体；后期叠加路线名、距离/爬升、季节和难度信息。",
    imageSetStyle: "默认 5 张：封面现场图、路线图/轨迹截图、关键路况图、风景情绪图、装备/注意事项信息卡。",
    highEngagementRules: ["路线名和难度一眼可见", "路线图必须能帮助判断是否适合自己", "真实现场图优先，AI 只做补光、构图和氛围统一", "天气、开放状态、交通和轨迹必须人工核验"],
    avoid: ["不要伪造亲历或登顶", "不要伪造 GPS 轨迹", "不要生成不存在的危险路况或风景", "不要过度滤镜导致路况误导"]
  },
  museum: {
    modeName: "展馆研学图文协同图集",
    coverStyle: "真实展品、展厅空间、导览图或活动现场做视觉锚点，后期叠加展名、展期、适合人群和预约提示。",
    imageSetStyle: "默认 5 张：封面展品/展厅图、观展动线图、核心展品故事图、预约票务信息卡、亲子/研学互动卡。",
    highEngagementRules: ["展期和预约信息要清楚", "展品故事提升停留", "亲子研学信息能提升收藏", "拍摄规则和版权要可确认"],
    avoid: ["不要伪造馆藏和展品来源", "不要违反馆方拍摄规则", "不要误导展期票务", "不要使用未授权观众肖像"]
  },
  product: {
    modeName: "地域产品文创图文协同图集",
    coverStyle: "真实产品、包装、产地或使用场景做视觉锚点，后期叠加产品名、产地、适合场景和购买理由。",
    imageSetStyle: "默认 5 张：封面产品图、原料/工艺图、使用/送礼场景图、规格价格信息卡、FAQ 互动卡。",
    highEngagementRules: ["产品外观和规格必须真实", "产地和工艺要可核验", "送礼/自用场景要清楚", "价格库存和物流要人工确认"],
    avoid: ["不要夸大功效", "不要伪造产地", "不要改变包装规格", "不要虚构销量库存"]
  },
  service: {
    modeName: "本地服务图文协同图集",
    coverStyle: "真实服务空间、流程细节、工具设备或授权案例图做视觉锚点，后期叠加服务项目、适合人群和预约条件。",
    imageSetStyle: "默认 5 张：封面服务结果/空间图、流程细节图、设备/资质图、价格预约信息卡、FAQ 互动卡。",
    highEngagementRules: ["服务流程要具体", "价格周期和预约条件要清楚", "案例必须授权", "资质和效果表达要克制"],
    avoid: ["不要夸大效果", "不要伪造案例", "不要泄露隐私", "不要承诺无法保证的结果"]
  }
};

const weddingVisualStrategy: VisualStrategy = {
  modeName: "婚礼图片细节拆解图文",
  coverStyle: "真实婚礼现场细节做视觉锚点，优先选择婚礼蛋糕、甜品台、花艺、仪式区、迎宾牌、桌花、席位卡、手捧花、灯光布幔等一个高记忆点；后期叠加风格关键词、细节名称和备婚收藏理由。",
  imageSetStyle: "默认 5 张：封面婚礼细节图、同场景远景/关系图、细节近景拆解、风格/预算/适合人群信息卡、备婚 FAQ/咨询引导卡。",
  highEngagementRules: ["图片先判断细节，再定选题，不要先写泛泛婚礼服务", "一篇只聚焦一个可被新人收藏的细节", "爆款风格要学习标题节奏、细节命名和情绪表达，不能照搬文案", "真实案例和新人肖像必须授权", "价格、档期、场地和套餐只写已确认信息"],
  avoid: ["不要伪造真实婚礼案例", "不要使用未授权新人/宾客肖像", "不要夸大落地效果", "不要虚构价格档期和场地信息", "不要把 AI 图当真实案例"]
};

function strategyFor(accountType: string) {
  return strategyByMode[accountVisualMode(accountType)];
}

function strategyForAccount(account: Account) {
  return isWeddingAccount(account) ? weddingVisualStrategy : strategyFor(account.accountType);
}

function modeCopy(accountType: string) {
  const mode = accountVisualMode(accountType);
  const copy: Record<AccountVisualMode, {
    sourceHint: string;
    noSourceHint: string;
    promptTitle: string;
    imageAnchorRule: string;
    textRule: string;
    factRule: string;
    defaultStyleBrief: string[];
    layoutRules: string[];
  }> = {
    culture_tourism: {
      sourceHint: "优先识别真实目的地图、活动现场图、导览图、交通/票务截图和服务信息；图 1/3 用真实现场图做 image2，信息卡只做后期排版。",
      noSourceHint: "未提供图片：请先输出目的地拍摄清单和素材缺口；如必须出图，只能生成低拟真辅助图或信息卡，不得伪装为真实目的地或真实活动。",
      promptTitle: "文旅图片执行 Prompt",
      imageAnchorRule: "真实目的地、活动现场或导览资料是视觉锚点；AI 只能做图生图补光、构图、天气氛围和信息卡底图。",
      textRule: "现场图讲地点和体验；动线图讲路线、时长和节点；信息卡讲交通、票务、开放时间和人工核验。",
      factRule: "禁止改变地点、路线、开放状态、票价、活动时间、交通、真实人流和服务条件。",
      defaultStyleBrief: ["封面必须以真实目的地或活动现场图为锚点。", "图集按“封面体验 / 游览动线 / 核心看点 / 服务信息 / 评论互动”组织。", "AI 图生图只做轻度优化和补图，不虚构目的地。"],
      layoutRules: ["封面：真实地标或体验占主体，底部放地点/时长/适合人群标签。", "动线图：标清起点、终点、交通、厕所/停车/餐饮等服务点。", "信息卡：白底或浅色底，列出开放、票务、交通和活动核验项。"]
    },
    heritage: {
      sourceHint: "优先识别真实工艺细节、作品、活动现场、传承人授权图和体验过程；图 1/2/3 用真实素材做 image2。",
      noSourceHint: "未提供图片：请先输出非遗/民俗拍摄清单和授权缺口；如必须出图，只能生成低拟真辅助图或信息卡，不得伪装为真实传承人、作品或仪式。",
      promptTitle: "民俗非遗图片执行 Prompt",
      imageAnchorRule: "真实工艺、作品、活动现场和授权人物图是视觉锚点；AI 只能做补光、构图、背景和信息卡延展。",
      textRule: "工艺图讲材料、步骤和质感；人物/故事图讲可核验身份和背景；信息卡讲体验方式、时间地点和禁忌。",
      factRule: "禁止伪造传承人、仪式、民族/宗教元素、作品来源、活动现场和授权状态。",
      defaultStyleBrief: ["封面必须以真实工艺、作品或活动现场为锚点。", "图集按“封面工艺 / 制作流程 / 故事人物 / 体验预约 / 尊重禁忌”组织。", "表达尊重文化语境，避免猎奇化。"],
      layoutRules: ["封面：手作细节或活动现场占主体，短字写清工艺/地点/体验方式。", "流程图：用小标签标出步骤、材料和可体验环节。", "信息卡：列出预约、适合人群、拍摄授权和文化禁忌。"]
    },
    stay: {
      sourceHint: "优先识别真实房间、窗景、公共区、营地设施、早餐、周边体验和价格政策截图；图 1/2/3 用真实空间图做 image2。",
      noSourceHint: "未提供图片：请先输出房型/空间/周边体验拍摄清单；如必须出图，只能生成低拟真辅助图或信息卡，不得伪装为真实房型。",
      promptTitle: "住宿图片执行 Prompt",
      imageAnchorRule: "真实房型、空间、窗景和营地设施是视觉锚点；AI 只能做补光、构图和氛围延展。",
      textRule: "空间图讲房型和设施；周边图讲可达体验；信息卡讲价格、房态、退改、停车、亲子/宠物政策。",
      factRule: "禁止改变房间面积、景观、设施、价格、房态和服务政策。",
      defaultStyleBrief: ["封面必须以真实房间、窗景或营地空间为锚点。", "图集按“封面空间 / 房型设施 / 周边体验 / 价格预订 / FAQ”组织。", "价格和房态必须进入人工核验。"],
      layoutRules: ["封面：房间或景观占主体，放地点/房型/适合人群标签。", "设施图：标清床型、卫浴、窗景、停车、宠物/亲子政策。", "信息卡：列出价格区间、预订方式和限制条件。"]
    },
    food: {
      sourceHint: "优先按文件名识别真实菜品图和环境图；图片文件名应尽量就是菜品名或环境名，例如 清蒸鲈鱼.jpg、竹林土鸡.jpg、包间.jpg、门头.jpg、停车场入口.jpg。图 1/2/3 用菜品图做 image2，图 4/5 用环境图轻处理，图 6 用真实门头/停车/道路信息生成交通指南漫画卡。",
      noSourceHint: "未提供图片：请先输出待整理图片清单，要求客户尽量按菜品名、环境名或交通节点命名；如必须出图，只能生成低拟真辅助图或信息卡，不得伪装为真实菜品或真实门店。",
      promptTitle: "餐饮图片执行 Prompt",
      imageAnchorRule: "真实菜品图是视觉锚点；AI 只能做图生图补光、构图、桌面、餐具、背景和氛围延展。",
      textRule: "正文必须先确定本篇主轴：单个菜品、营销活动或当地特色。菜品图讲菜名、口味、分量、食材或吃法；活动图讲活动权益、时间和限制；当地特色图讲地域食材/做法/来这里吃的理由；环境图讲座位、包间、门头、停车和交通。未确认的价格、人均、距离、营业时间、停车、活动和食材来源必须标记待确认。",
      factRule: "禁止改变菜品关键食材、真实分量、摆盘结构、门店空间、交通位置、价格、活动和营业信息。",
      defaultStyleBrief: ["封面必须以真实主推菜图为锚点，文字后期叠加。", "图集按“主推菜 / 菜品细节 / 套餐或第二道菜 / 内部环境 / 外部门头 / 交通指南漫画”组织。", "图片文件名应使用菜品名、环境名或交通节点名，方便龙虾自动识别。", "AI 图生图只做轻度优化和补图，不改变真实出品。"],
      layoutRules: ["封面：主菜占 60% 以上，底部只放已确认的商圈/人均/场景标签，未确认则不写具体数字。", "菜品图：前 2-3 张保持连续食欲冲击，每张只讲一道菜或一个套餐信息。", "环境图：第 4-5 张展示包间、大厅、门头或外部环境，标注适合场景。", "交通漫画卡：用简洁漫画/手绘路线感表达停车场、路口、地标和到店路径，必须基于真实交通信息；未确认字段写待确认，不能画不存在的地标。", "信息卡：清楚列出菜单、价格、预约、活动和人工核验项；没有确认资料时输出补资料清单。"]
    },
    outdoor: {
      sourceHint: "优先识别真实现场图、路线图和轨迹截图；图 1/3/4 用现场图做 image2，图 2 保持路线数据真实。",
      noSourceHint: "未提供图片：请先输出拍摄清单和素材缺口；如必须出图，只能生成低拟真辅助图或信息卡，不得伪装为真实路线或真实亲历。",
      promptTitle: "户外路线图片执行 Prompt",
      imageAnchorRule: "真实现场图是视觉锚点；AI 只能做图生图补光、构图、天气氛围和局部画面延展。",
      textRule: "现场图讲风景、路况、季节和体感；路线图讲起终点、距离、爬升和撤退点；信息卡讲交通、补给、装备和安全核验。",
      factRule: "禁止改变真实路况、地貌、天气、距离、爬升、轨迹、开放状态、交通、价格和安全风险。",
      defaultStyleBrief: ["封面必须以真实现场图为锚点，文字后期叠加。", "图集按“封面现场 / 路线轨迹 / 关键路况 / 风景情绪 / 装备安全”组织。", "AI 图生图只做轻度优化和补图，不改变真实路况。"],
      layoutRules: ["封面：真实现场图占主体，底部放地点/距离/难度或季节标签。", "路线图：保留原始轨迹截图或人工绘制图，标清起终点、补给、撤退和风险点。", "信息卡：列出交通、装备、天气、开放状态和人工核验项。"]
    },
    museum: {
      sourceHint: "优先识别真实展品授权图、展厅图、导览图、活动海报和票务预约截图；图 1/2/3 基于真实素材处理。",
      noSourceHint: "未提供图片：请先输出展品/展厅/导览/票务素材缺口；如必须出图，只能生成低拟真辅助图或信息卡，不得伪装为真实展品或真实展览。",
      promptTitle: "展馆研学图片执行 Prompt",
      imageAnchorRule: "真实展品、展厅、导览图和活动资料是视觉锚点；AI 只能做轻度构图、补光和信息卡排版。",
      textRule: "展品图讲看点和故事；动线图讲参观顺序；信息卡讲展期、预约、票务、拍摄规则和适合人群。",
      factRule: "禁止伪造馆藏、展品细节、展期、票务、讲解员和观众反馈。",
      defaultStyleBrief: ["封面必须以真实展品、展厅或活动资料为锚点。", "图集按“封面展品 / 观展动线 / 展品故事 / 预约票务 / 研学互动”组织。", "拍摄规则和版权限制必须进入核验。"],
      layoutRules: ["封面：展品或展厅占主体，放展名/展期/适合人群标签。", "动线图：标清入口、重点展区、时长和预约点。", "信息卡：列出展期、票务、预约、拍摄规则。"]
    },
    product: {
      sourceHint: "优先识别真实产品、包装、原料、制作过程、产地和价格规格图；图 1/2/3 用真实产品图做 image2。",
      noSourceHint: "未提供图片：请先输出产品、包装、产地、规格价格拍摄清单；如必须出图，只能生成低拟真辅助图或信息卡，不得伪装为真实产品。",
      promptTitle: "产品文创图片执行 Prompt",
      imageAnchorRule: "真实产品、包装、产地和制作过程是视觉锚点；AI 只能做补光、构图、背景和场景延展。",
      textRule: "产品图讲外观、规格和用途；工艺图讲原料和制作；信息卡讲价格、库存、物流、保存和购买限制。",
      factRule: "禁止改变产品外观、包装、规格、产地、价格、库存、功效和资质。",
      defaultStyleBrief: ["封面必须以真实产品和包装为锚点。", "图集按“封面产品 / 原料工艺 / 使用送礼 / 规格价格 / FAQ”组织。", "产地、资质、价格和库存必须核验。"],
      layoutRules: ["封面：产品和包装占主体，放产地/用途/适合人群标签。", "工艺图：标清原料、制作步骤和真实来源。", "信息卡：列出规格、价格、物流、保存和购买提醒。"]
    },
    service: {
      sourceHint: "优先识别真实门店空间、服务流程、工具设备、资质和授权案例图；图 1/2/3 基于真实素材处理。",
      noSourceHint: "未提供图片：请先输出空间、流程、设备、资质、授权案例素材缺口；如必须出图，只能生成低拟真辅助图或信息卡，不得伪装为真实案例。",
      promptTitle: "本地服务图片执行 Prompt",
      imageAnchorRule: "真实空间、流程、工具设备和授权案例是视觉锚点；AI 只能做补光、构图和信息卡排版。",
      textRule: "流程图讲服务步骤；设备/资质图讲信任；信息卡讲价格、周期、预约、禁忌和隐私授权。",
      factRule: "禁止伪造顾客案例、效果对比、资质证书、服务结果和隐私授权。",
      defaultStyleBrief: ["封面必须以真实空间、流程或授权案例图为锚点。", "图集按“封面服务 / 流程细节 / 设备资质 / 价格预约 / FAQ”组织。", "案例、效果和隐私授权必须核验。"],
      layoutRules: ["封面：服务空间或流程细节占主体，放项目/适合人群/预约条件标签。", "流程图：标清步骤、周期、注意事项。", "信息卡：列出价格、预约、资质和风险边界。"]
    }
  };
  return copy[mode];
}

function modeCopyForAccount(account: Account) {
  if (!isWeddingAccount(account)) return modeCopy(account.accountType);
  return {
    sourceHint: "优先按文件名和画面内容识别婚礼细节：婚礼蛋糕、甜品台、花艺、仪式区、迎宾牌、桌花、席位卡、手捧花、灯光、布幔、合影区、誓言本、戒指、请柬、菜单卡。先判断每张图能写成哪个小红书选题，再选一个最有收藏价值的细节做单篇主题。",
    noSourceHint: "未提供图片：请先输出婚礼素材整理清单，要求客户提供真实婚礼现场图，并按细节命名，例如 婚礼蛋糕.jpg、香槟色花艺.jpg、仪式区拱门.jpg、迎宾牌.jpg、桌花.jpg；如必须出图，只能生成低拟真辅助图或信息卡，不得伪装为真实婚礼案例。",
    promptTitle: "婚礼图片细节拆解执行 Prompt",
    imageAnchorRule: "真实婚礼图片是选题入口和视觉锚点；AI 只能做轻度补光、构图、背景延展和信息卡排版，不得改变婚礼现场核心设计、花材、蛋糕、场地结构和新人肖像。",
    textRule: "先读图识别细节，再围绕一个细节写笔记：蛋糕讲层数、色系、装饰和适合风格；花艺讲花材、色系、空间层次和仪式感；仪式区讲动线、背景、灯光和拍照效果；迎宾区/席位卡/菜单卡讲宾客体验和高级感。正文必须参考同类型爆款文章的标题节奏、细节命名、情绪表达和收藏理由，但不得照搬原文。",
    factRule: "禁止伪造真实新人案例、宾客反馈、价格、档期、场地、套餐、花材成本、婚礼效果和肖像授权；未确认信息写待确认。",
    defaultStyleBrief: ["封面必须以真实婚礼细节图为锚点。", "一篇只讲一个细节，如婚礼蛋糕、花艺、仪式区、迎宾区或桌面布置。", "先判断图片里的可写点，再生成标题、图上短字和正文。", "参考爆款风格但不照搬文案，重点学习标题节奏和收藏理由。", "新人/宾客肖像、场地和价格必须人工核验。"],
    layoutRules: ["封面：婚礼细节占主体，短字写“细节名 + 风格关键词 + 备婚收藏理由”。", "细节拆解图：用 2-4 个短标签标出色系、材质、花材、层次、场景作用。", "关系图：展示该细节在全场婚礼中的位置，帮助新人理解落地效果。", "信息卡：列出适合婚礼风格、预算/档期/场地待确认项、适合人群和咨询问题。", "不要在图上暴露新人隐私、手机号、真实合同价格和未授权肖像。"]
  };
}

function imageStructureFor(accountType: string) {
  const strategy = strategyFor(accountType);
  const mode = accountVisualMode(accountType);
  const items: Record<AccountVisualMode, string[]> = {
    culture_tourism: [
      "图 1｜封面地标/体验图：用真实目的地、活动现场或核心体验做底。",
      "图 2｜游览动线图：展示起终点、时长、交通、服务点和核心节点。",
      "图 3｜核心看点图：建筑、街区、节庆、演出、自然景观或体验细节。",
      "图 4｜交通票务信息卡：开放时间、票价、预约、交通、停车、限制条件。",
      "图 5｜评论互动卡：引导用户留言出行日期、同行人和想看的体验。"
    ],
    heritage: [
      "图 1｜封面工艺/活动图：用真实工艺、作品、活动现场或体验过程做底。",
      "图 2｜制作流程图：材料、步骤、工具和可参与环节。",
      "图 3｜人物/故事图：传承人授权图、场地故事或作品来源。",
      "图 4｜体验预约信息卡：时间地点、适合人群、价格/预约和授权提示。",
      "图 5｜尊重禁忌/互动卡：文化背景、拍摄边界、评论问题。"
    ],
    stay: [
      "图 1｜封面房间/景观图：真实房型、窗景、营地或公共区。",
      "图 2｜房型设施图：床型、卫浴、停车、亲子/宠物、公共空间。",
      "图 3｜周边体验图：步行可达、路线、餐饮、活动或景点。",
      "图 4｜价格预订信息卡：价格区间、房态、退改、入住限制。",
      "图 5｜FAQ 互动卡：引导用户留言日期、人数、预算和特殊需求。"
    ],
    food: [
      "图 1｜封面主推菜图：使用真实主推菜或当天活动主菜做底，文件名应能直接看出菜名。",
      "图 2｜主推菜细节图：突出食材、口味、分量、吃法或本地特色做法。",
      "图 3｜第二道菜/套餐组合图：补充套餐完整度、同行人数或营销活动权益。",
      "图 4｜内部环境图：大厅、包间、窗边、吧台或适合聚餐/家庭/游客的座位。",
      "图 5｜外部环境/门头图：门头、周边环境、停车入口或附近地标。",
      "图 6｜交通指南漫画/信息卡：用简洁漫画或手绘路线感说明停车、路口、地标和到店路径，交通信息必须人工核验。"
    ],
    outdoor: [
      "图 1｜封面现场图：使用真实路线风景、路况或目的地照片做底。",
      "图 2｜路线图/轨迹截图：展示起终点、距离、爬升、补给和撤退点。",
      "图 3｜关键路况图：岔路、碎石坡、林道、台阶、渡口、垭口等。",
      "图 4｜风景情绪图：展示值得去的视野、季节、海岸、山谷或森林。",
      "图 5｜装备/注意事项信息卡：交通、天气、补给、装备、开放状态和适合人群。"
    ],
    museum: [
      "图 1｜封面展品/展厅图：真实展品、展厅空间或活动资料。",
      "图 2｜观展动线图：入口、重点展区、路线、时长和预约点。",
      "图 3｜核心展品故事图：展品看点、历史背景或互动项目。",
      "图 4｜预约票务信息卡：展期、开放时间、票务、拍摄规则。",
      "图 5｜亲子/研学互动卡：年龄段、讲解、作业/研学问题和评论引导。"
    ],
    product: [
      "图 1｜封面产品图：真实产品、包装或礼盒做底。",
      "图 2｜原料/工艺图：产地、材料、制作过程和真实来源。",
      "图 3｜使用/送礼场景图：自用、伴手礼、节日、旅行购买场景。",
      "图 4｜规格价格信息卡：规格、价格、库存、物流、保存和限制条件。",
      "图 5｜FAQ 互动卡：口味、用途、预算、送礼对象和购买问题。"
    ],
    service: [
      "图 1｜封面服务结果/空间图：真实服务空间、流程细节或授权案例图。",
      "图 2｜流程细节图：步骤、工具、周期和注意事项。",
      "图 3｜设备/资质图：设备、环境、资质或团队信任证据。",
      "图 4｜价格预约信息卡：价格、套餐、时长、预约和禁忌。",
      "图 5｜FAQ 互动卡：顾虑、预算、时间和是否适合的评论问题。"
    ]
  };

  return {
    name: strategy.modeName,
    countRule:
      mode === "food"
        ? "默认输出 6 张图；如果真实素材特别少，可降为 5 张，但必须保留主推菜、环境图、交通指南/信息卡和人工核验清单。"
        : "默认输出 5 张图；如果真实素材特别少，可降为 4 张，但必须保留真实素材锚点、信息卡和人工核验清单。",
    items: items[mode],
    layoutRules: [
      strategy.coverStyle,
      "图片和正文必须一一对应，图里出现什么素材，正文就讲什么判断；不要拿无关图片硬讲卖点。",
      "中文标题、标签、价格、路线、票务、预约和风险提示全部后期叠加，image2 不直接生成文字。",
      modeCopy(accountType).factRule,
      "所有影响消费、出行、预约或安全决策的信息都要进入人工核验清单。"
    ]
  };
}

function weddingImageStructure() {
  return {
    name: weddingVisualStrategy.modeName,
    countRule: "默认输出 5 张图；如果素材特别多，也不要做大而全图集，必须围绕一个婚礼细节完成“封面吸引 + 细节拆解 + 场景关系 + 信息卡 + FAQ”。",
    items: [
      "图 1｜封面婚礼细节图：从真实图片中选择最有记忆点的蛋糕、花艺、仪式区、迎宾区、桌花或甜品台。",
      "图 2｜场景关系图：展示这个细节在整场婚礼中的位置，例如仪式区全景、桌面整体、甜品台全貌。",
      "图 3｜细节近景拆解图：放大材质、花材、层次、色系、蛋糕装饰、灯光或纸品细节。",
      "图 4｜风格/预算/适合人群信息卡：说明适合的婚礼风格、季节、场地类型和需人工确认的价格/档期。",
      "图 5｜备婚 FAQ/咨询引导卡：引导新人留言预算、城市、婚期、场地和喜欢的风格。"
    ],
    layoutRules: [
      weddingVisualStrategy.coverStyle,
      "图片和正文必须一一对应，图里出现什么婚礼细节，正文就讲什么细节判断。",
      "中文标题、标签、预算、档期、场地和授权提示全部后期叠加，image2 不直接生成文字。",
      "禁止伪造新人肖像授权、真实案例效果、价格、档期和场地信息。",
      "所有影响咨询、预算和落地判断的信息都要进入人工核验清单。"
    ]
  };
}

function imageStructureForAccount(account: Account) {
  return isWeddingAccount(account) ? weddingImageStructure() : imageStructureFor(account.accountType);
}

type ReferenceResearchLike = Pick<
  AccountReferenceResearch,
  "contentFeatures" | "summaryMarkdown" | "selectedAccounts" | "rawResults"
> | null | undefined;

function compactResearchLines(research: ReferenceResearchLike, accountType: string, wedding = false) {
  const text = [research?.contentFeatures, research?.summaryMarkdown, research?.selectedAccounts, research?.rawResults]
    .filter(Boolean)
    .join("\n");
  if (!text.trim()) return [];

  const mode = accountVisualMode(accountType);
  const common = ["图", "图片", "封面", "视觉", "构图", "实拍", "滤镜", "色调", "信息卡", "小红书"];
  const weddingKeywords = ["婚礼", "婚庆", "备婚", "新人", "新娘", "蛋糕", "甜品台", "花艺", "仪式区", "迎宾", "桌花", "席位卡", "灯光", "布幔", "风格", "案例"];
  const modeKeywords: Record<AccountVisualMode, string[]> = {
    culture_tourism: ["文旅", "景区", "街区", "目的地", "路线", "票务", "活动", "交通", "拍照"],
    heritage: ["民俗", "非遗", "工艺", "传承", "体验", "节庆", "作品", "手作"],
    stay: ["民宿", "酒店", "露营", "房间", "窗景", "设施", "周边", "预订"],
    food: ["菜品", "环境", "菜单", "价格", "门头", "空间", "套餐", "新品", "氛围"],
    outdoor: ["路线", "轨迹", "地图", "路况", "风景", "山", "海", "森林", "装备", "攻略"],
    museum: ["博物馆", "展览", "展品", "展厅", "研学", "票务", "导览", "预约"],
    product: ["产品", "文创", "特产", "包装", "产地", "工艺", "礼盒", "价格"],
    service: ["服务", "案例", "流程", "设备", "价格", "预约", "门店", "资质"]
  };
  const visualKeywords = [...common, ...(wedding ? weddingKeywords : modeKeywords[mode])];
  const lines = text
    .split(/\n|。|；|;/)
    .map((line) =>
      line
        .replace(/[#>*_`-]/g, "")
        .replace(/\*\*/g, "")
        .replace(/https?:\/\/\S+/g, "")
        .trim()
    )
    .filter((line) => line.length >= 8 && line.length <= 90)
    .filter((line) => visualKeywords.some((keyword) => line.includes(keyword)));

  return Array.from(new Set(lines)).slice(0, 8);
}

export function buildImageStyleStudy(account: Account, research: ReferenceResearchLike) {
  const strategy = strategyForAccount(account);
  const researchLines = compactResearchLines(research, account.accountType, isWeddingAccount(account));
  const learned = researchLines.length
    ? researchLines
    : ["参考研究暂未形成明确图片结论，先采用该客户业态的图文协同规律。", strategy.coverStyle, strategy.imageSetStyle];

  return `## ${strategy.modeName}风格研究摘要

### 同类型账号可借鉴的图片共性
${strategy.highEngagementRules.map((rule) => `- ${rule}`).join("\n")}

### 从参考账号研究中提炼出的视觉线索
${learned.map((line) => `- ${line}`).join("\n")}

### 本账号建议采用的封面结构
- ${strategy.coverStyle}
- 封面底图负责真实感和点击，核心信息后期叠加。
- 先让用户一眼知道“这是什么、在哪里、适合谁、为什么值得收藏”。

### 本账号建议采用的图集结构
- ${strategy.imageSetStyle}
- 每张图只承担一个信息任务：封面吸引点击，真实素材建立信任，信息卡提升收藏和转化，互动卡收集下一篇选题。
- AI 生成图必须保留“基于真实素材延展”的边界，不能伪装成真实地点、真实活动、真实产品、真实路线或真实案例。`;
}

export function buildCompactImageStyleBrief(account: Account, research: ReferenceResearchLike) {
  const strategy = strategyForAccount(account);
  const structure = imageStructureForAccount(account);
  const copy = modeCopyForAccount(account);
  const researchLines = compactResearchLines(research, account.accountType, isWeddingAccount(account)).slice(0, 3);
  const rules = [
    `统一视觉：${structure.name}`,
    structure.countRule,
    ...strategy.highEngagementRules.slice(0, 3),
    ...copy.defaultStyleBrief,
    ...researchLines
  ];

  return Array.from(new Set(rules)).slice(0, 8);
}

export function buildImagePrompt(input: {
  account: Account;
  noteTask: NoteTask;
  styleBrief?: string[];
  openclawImagePaths?: string;
  imageSourceMode?: string;
  noteContent?: string;
  singleGoal?: string;
  imageCount?: string;
  expertRules?: string;
}) {
  const { account, noteTask, styleBrief, openclawImagePaths, imageSourceMode, noteContent, singleGoal, imageCount, expertRules } = input;
  const strategy = strategyForAccount(account);
  const structure = imageStructureForAccount(account);
  const copy = modeCopyForAccount(account);
  const wedding = isWeddingAccount(account);
  const sourceMode = imageSourceMode === "ai_generate" || imageSourceMode === "remote_images" ? imageSourceMode : "remote_images";
  const compactStyle = styleBrief?.length ? styleBrief : [...strategy.highEngagementRules.slice(0, 3), ...copy.defaultStyleBrief];
  const styleExtras = compactStyle
    .filter((item) => !/统一视觉|默认输出|默认\s*5|封面必须以真实/.test(item))
    .slice(0, 3);
  const modeLines = {
    ai_generate: [
      "图片来源模式：AI 辅助图，按笔记内容生成补充画面、信息卡底图或结构说明图。",
      `希望图片数量：${imageCount || "按图集结构决定"}`,
      `本篇额外要求：${singleGoal || "根据笔记内容生成辅助画面、封面候选和信息卡提示词。"}`,
      "真实素材优先；如果没有真实素材，优先生成信息卡、结构说明图、路线/流程/要点卡、低拟真辅助画面，不生成伪真实现场、伪真实案例、伪真实菜品、伪真实路线或伪真实客户反馈。",
      "画面必须降低平台可感知的 AI 味：普通手机拍摄感、自然光、轻微构图不完美、真实环境细节少量保留、不过度磨皮、不过度锐化、不过度景深、不过分干净、不过分梦幻、不要商业广告棚拍、不要 3D 渲染质感、不要超现实光影。",
      "对外发布的图片、标题、正文、图上文字和图注里，不要标注任何来源说明；来源和风险只写入内部审核备注。",
      "输出每张图的生成提示词、图上短字、正文对应句、负向提示和内部合规备注。"
    ],
    remote_images: [
      "图片来源模式：用户已经手动指定多张图片链接。",
      `指定图片链接：${openclawImagePaths || "未填写"}`,
      `本篇额外要求：${singleGoal || "优先使用用户指定的素材库图片，判断封面、图集顺序和图上文字。"}`,
      copy.sourceHint,
      "不要读取未指定图片来替换用户选择；如指定图片不足，只列补图建议。"
    ]
  };
  const sourceLines = modeLines[sourceMode];
  const singleContent = (noteContent || "").trim() || noteTask.bodyStructure || noteTask.coreView || "未填写，按当前选题字段生成。";

  return `# ${noteTask.topicTitle} ${copy.promptTitle}

## 任务
- 账号：${account.name} / ${account.accountParam}
- 选题：${noteTask.topicTitle}
- 单篇笔记内容/方向：${singleContent}
- 封面方向：${noteTask.coverCopyDirection}
- 用户痛点/场景：${noteTask.painPoint}
- 推荐素材：${noteTask.recommendedAssets || "未提供"}
- ${sourceLines.join("\n- ")}

## 已沉淀专家规则
${expertRules || "暂无已保存规则；按当前账号图片策略生成。"}

## 硬规则
- 统一模式：${structure.name}
- ${structure.countRule}
- ${copy.imageAnchorRule}
- ${copy.factRule}
- ${sourceMode === "ai_generate" ? "当前没有真实图片时，只能输出辅助画面、信息卡或结构说明方案；不得伪装成真实案例、真实现场、真实菜品、真实路线、真实客户反馈或真实服务过程。" : wedding ? "必须先对真实婚礼图片做画面判断：列出可写细节候选，并选择一个最适合小红书爆款风格的细节作为本篇主轴。" : "先判断真实素材是否匹配本篇选题，再决定图集顺序。"}
- image2 不直接生成中文文字；标题、价格、路线、票务、标签、风险提示全部后期叠加。
- 严禁把来源说明、生成方式或内部真实性判断放到图片、标题、正文、图注或文件名里；这些只写在内部审核备注。
${styleExtras.length ? `- ${styleExtras.join("\n- ")}` : ""}

${sourceMode === "ai_generate" ? `## AI 辅助图画面约束
- 优先做信息卡底图、结构图、流程图、路线/要点图、局部氛围补充图；不要把它当真实证据图。
- 若需要接近实拍，使用普通手机照片语言：自然光、轻微噪点、真实边缘细节、轻微构图偏差、不过度统一色调。
- 禁止使用这些方向：电影级、超写实、梦幻、奢华广告、完美光影、3D 渲染、棚拍大片、过度景深、玻璃皮肤、塑料食物、虚假人群、虚假门店、虚假路线。
- 不生成清晰可识别的人脸、品牌 Logo、车牌、合同、票据、手机号、价格牌和可被误认为事实的信息。
- 最终对外内容只呈现画面和文案，不出现任何来源标签。` : ""}

## 图集结构
${structure.items.map((item, index) => `${index + 1}. ${item}`).join("\n")}

## 逐图文案联动
- 每张图必须输出一句“图上短字”和一句“正文对应句”。
- ${copy.textRule}
- 不允许正文讲图里没有出现的素材，不允许用图片暗示未经确认的信息。

## 后期排版
- ${copy.layoutRules.join("\n- ")}
- 整组图片字体、边距、色彩统一，适合小红书手机端阅读。

## 输出格式
对每张图只输出：
- 用途
- 素材依据（真实素材路径；没有真实素材时写画面依据）
- image2 Prompt
- 图上短字
- 正文对应句
- 后期排版指令
- 负向提示
- 内部真实性备注（仅审核，不上图）

最后列：必须补拍/授权/人工确认的素材缺口。`;
}
