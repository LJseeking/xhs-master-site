"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Clipboard,
  Download,
  FileText,
  Gauge,
  ImageIcon,
  LayoutDashboard,
  Library,
  MessageCircle,
  NotebookPen,
  Plus,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import type React from "react";
import clsx from "clsx";

type Template = {
  id: number;
  typeKey: string;
  name: string;
  defaultColumns: string;
  weeklyRatio: string;
};

type Account = {
  id: number;
  name: string;
  accountParam: string;
  accountType: string;
  stage: string;
  personaBase: string;
  city: string;
  targetUsers: string;
  painPoints: string;
  contentDirections: string;
  businessGoals: string;
  monetization: string;
  referenceAccounts: string;
  materialCondition: string;
  taboos: string;
  profilePath: string;
  assetsPath: string;
  strategy?: { markdown: string; positioning: string; execGuide: string } | null;
  profile?: { content: string; version: number; path: string } | null;
  referenceResearches?: ReferenceResearch[];
  imageStyleStudies?: ImageStyleStudy[];
  interactionPlans?: InteractionPlan[];
  assets: Asset[];
  weeklyPlans: WeeklyPlan[];
};

type ReferenceResearch = {
  id: number;
  searchKeywords: string;
  commandJson: string;
  researchPrompt: string;
  rawResults: string;
  selectedAccounts: string;
  summaryMarkdown: string;
  contentFeatures: string;
  personaInsights: string;
  strategyInsights: string;
  status: string;
};

type ImageStyleStudy = {
  id: number;
  searchKeywords: string;
  commandJson: string;
  researchPrompt: string;
  rawResults: string;
  summaryMarkdown: string;
  styleBriefJson: string;
  status: string;
};

type InteractionPlan = {
  id: number;
  noteTaskId: number | null;
  searchKeywords: string;
  commandJson: string;
  discoveryPrompt: string;
  commentPrompt: string;
  rawResults: string;
  targetUsersMarkdown: string;
  commentDraftsMarkdown: string;
  status: string;
};

type Asset = {
  id: number;
  filePath: string;
  fileType: string;
  sourceType: string;
  tags: string;
  suitableTypes: string;
  coverReady: boolean;
  used: boolean;
  authorizationState: string;
  riskNotes: string;
};

type WeeklyPlan = {
  id: number;
  weekStart: string;
  theme: string;
  goal: string;
  frequency: number;
  testHypothesis: string;
  commercializationMove: string;
  interactionGoal: string;
  availableAssets: string;
  taboos: string;
  noteTasks: NoteTask[];
};

type NoteTask = {
  id: number;
  publishAt: string;
  contentType: string;
  contentGoal: string;
  topicTitle: string;
  targetUser: string;
  painPoint: string;
  coreView: string;
  bodyStructure: string;
  requiredImages: string;
  recommendedAssets: string;
  coverCopyDirection: string;
  commentHook: string;
  expectedGoal: string;
  status: string;
};

type PromptResult = {
  prompt: { content: string; title: string };
  imagePrompt?: { content: string; title: string; path: string };
  commands: Array<{ category: string; command: string; description: string; safetyNote: string }>;
};

type ImagePromptResult = {
  imagePrompt: { content: string; title: string; path: string };
  referenceStyle: string;
  commands: Array<{ category: string; command: string; description: string; safetyNote: string }>;
};

type WeddingImagePlanResult = {
  planningPrompt: { content: string; title: string; path: string };
  commands: Array<{ category: string; command: string; description: string; safetyNote: string }>;
};

const mainTabs = [
  ["dashboard", "工作台", LayoutDashboard],
  ["accounts", "客户账号", ShieldCheck],
  ["assets", "上传素材", Library],
  ["weekly", "本周内容", CalendarDays],
  ["images", "图片方案", ImageIcon],
  ["prompts", "笔记草稿", Wand2],
  ["interactions", "发布互动", MessageCircle],
  ["drafts", "草稿保存", NotebookPen],
  ["reports", "复盘", Activity]
] as const;

const advancedTabs = [
  ["reference", "参考研究", Search],
  ["strategy", "策划案", Sparkles],
  ["agents", "配置文件", FileText],
  ["health", "系统状态", Gauge]
] as const;

const tabs = [...mainTabs, ...advancedTabs] as const;

const sourceTypes = [
  "真实素材",
  "文旅素材",
  "民俗/非遗素材",
  "活动现场",
  "导览/票务截图",
  "空间/房型实拍",
  "菜品实拍",
  "环境实拍",
  "路线图/轨迹截图",
  "现场实拍",
  "装备实拍",
  "产品实拍",
  "菜单/价格表",
  "品牌授权",
  "顾客/同行授权",
  "AI 图生图",
  "网络参考"
];
const authStates = ["待确认", "已授权", "可商用", "仅内部参考", "禁止发布"];

function accountUiMode(accountType?: string) {
  if (["hiking_diary", "mountain_route", "city_walk_nature", "overseas_hiking"].includes(accountType || "")) return "outdoor";
  if (["restaurant", "cafe_bakery", "hotpot_bbq_latenight", "bar_lightmeal"].includes(accountType || "")) return "food";
  if (accountType === "folk_custom_heritage") return "heritage";
  if (accountType === "homestay_hotel_camp") return "stay";
  if (accountType === "museum_exhibition_study") return "museum";
  if (accountType === "regional_product_cultural_creative") return "product";
  if (accountType === "local_life_service") return "service";
  return "culture_tourism";
}

function isHikingUiType(accountType?: string) {
  return accountUiMode(accountType) === "outdoor";
}

function assetUiCopy(accountType?: string) {
  const mode = accountUiMode(accountType);
  const copies = {
    culture_tourism: {
      folderPlaceholder: "/Users/wanglujie/Desktop/文旅项目素材",
      source: "文旅素材",
      tags: "例如：古镇, 活动现场, 导览图, 交通票务",
      suitable: "例如：目的地种草 / 游览动线 / 活动转化 / 交通票务",
      risk: "例如：开放时间、票价、活动日期和游客肖像需确认",
      singleTags: "例如：景区入口, 街区, 活动现场, 导览图, 停车",
      singleSuitable: "例如：目的地封面 / 动线攻略 / 票务信息卡 / 拍照机位",
      singleRisk: "开放状态需确认 / 活动日期需核验 / 游客肖像需授权",
      stylePlaceholder: "粘贴 xiaohongshu_auto_op 对同类型文旅图片风格的搜索和分析结果",
      assetsDirPlaceholder: "/path/to/assets/文旅项目/本篇笔记",
      imagePathsPlaceholder: "例如：\n古镇入口.jpg\n节庆活动现场.jpg\n导览图.png\n票务截图.jpg"
    },
    heritage: {
      folderPlaceholder: "/Users/wanglujie/Desktop/民俗非遗素材",
      source: "民俗/非遗素材",
      tags: "例如：非遗, 手作, 活动现场, 传承人授权",
      suitable: "例如：工艺故事 / 体验预约 / 节庆活动 / 研学转化",
      risk: "例如：传承人肖像、作品来源和文化禁忌需确认",
      singleTags: "例如：工艺细节, 作品, 传承人, 手作流程, 节庆",
      singleSuitable: "例如：非遗封面 / 制作流程 / 体验预约 / 文化科普",
      singleRisk: "肖像需授权 / 作品来源需确认 / 不做猎奇化表达",
      stylePlaceholder: "粘贴 xiaohongshu_auto_op 对同类型民俗/非遗图片风格的搜索和分析结果",
      assetsDirPlaceholder: "/path/to/assets/民俗非遗/本篇笔记",
      imagePathsPlaceholder: "例如：\n蓝染工艺细节.jpg\n手作流程.jpg\n活动现场.jpg\n预约信息.png"
    },
    stay: {
      folderPlaceholder: "/Users/wanglujie/Desktop/民宿酒店素材",
      source: "空间/房型实拍",
      tags: "例如：房型, 窗景, 公共区, 周边体验",
      suitable: "例如：房型空间 / 周边体验 / 价格预订 / FAQ",
      risk: "例如：房态、价格、退改和宠物政策需确认",
      singleTags: "例如：大床房, 窗景, 早餐, 停车, 营地",
      singleSuitable: "例如：房型封面 / 设施说明 / 周边攻略 / 价格卡",
      singleRisk: "房态需确认 / AI 不得改变房型和景观",
      stylePlaceholder: "粘贴 xiaohongshu_auto_op 对同类型住宿/营地图片风格的搜索和分析结果",
      assetsDirPlaceholder: "/path/to/assets/民宿酒店/本篇笔记",
      imagePathsPlaceholder: "例如：\n房间窗景.jpg\n公共区.jpg\n早餐.jpg\n价格政策.png"
    },
    food: {
      folderPlaceholder: "/Users/wanglujie/Desktop/长歌行菜品图",
      source: "菜品实拍",
      tags: "例如：长歌行, 清蒸鲈鱼, 竹林土鸡, 包间, 门头, 停车场入口",
      suitable: "例如：主推菜封面 / 菜品细节 / 套餐组合 / 环境图 / 交通指南漫画",
      risk: "例如：客户原图；文件名需用菜品名/环境名；交通、价格和活动需确认",
      singleTags: "例如：清蒸鲈鱼, 竹林土鸡, 包间, 门头, 停车场入口, 活动套餐",
      singleSuitable: "例如：单菜品种草 / 营销活动 / 当地特色 / 环境交通 / 交通漫画卡",
      singleRisk: "价格需确认 / 菜品名需匹配文件名 / AI 图生图不得改变真实出品 / 交通需核验",
      stylePlaceholder: "粘贴 xiaohongshu_auto_op 对同类型餐饮图片风格的搜索和分析结果",
      assetsDirPlaceholder: "/path/to/assets/门店名/本篇笔记",
      imagePathsPlaceholder: "例如：\n清蒸鲈鱼.jpg\n竹林土鸡.jpg\n包间.jpg\n大厅.jpg\n门头.jpg\n停车场入口.jpg"
    },
    outdoor: {
      folderPlaceholder: "/Users/wanglujie/Desktop/X的徒步日记路线图",
      source: "现场实拍",
      tags: "例如：X的徒步日记, 轨迹图, 现场图",
      suitable: "例如：路线攻略 / 封面 / 关键路况 / 装备复盘",
      risk: "例如：真实路线素材，出发信息需人工确认",
      singleTags: "例如：路线图, 轨迹, 山脊, 岔路, 补给, 封面",
      singleSuitable: "例如：路线攻略 / 路况提醒 / 装备复盘",
      singleRisk: "开放状态需确认 / AI 图生图 / 轨迹数据需核验",
      stylePlaceholder: "粘贴 xiaohongshu_auto_op 对同类型户外路线图片风格的搜索和分析结果",
      assetsDirPlaceholder: "/path/to/assets/X的徒步日记/本篇笔记",
      imagePathsPlaceholder: "例如：\n路线图-标毅线.png\n山脊路况.jpg\n轨迹截图.jpg"
    },
    museum: {
      folderPlaceholder: "/Users/wanglujie/Desktop/展馆研学素材",
      source: "文旅素材",
      tags: "例如：展览, 展厅, 展品授权, 预约票务",
      suitable: "例如：展览看点 / 观展动线 / 研学转化 / 票务信息",
      risk: "例如：拍摄规则、展期、票务和展品版权需确认",
      singleTags: "例如：展品, 展厅, 导览图, 票务, 亲子研学",
      singleSuitable: "例如：展览封面 / 展品故事 / 观展动线 / 预约卡",
      singleRisk: "展期需确认 / 展品版权需授权 / 拍摄规则需核验",
      stylePlaceholder: "粘贴 xiaohongshu_auto_op 对同类型展馆/研学图片风格的搜索和分析结果",
      assetsDirPlaceholder: "/path/to/assets/展馆研学/本篇笔记",
      imagePathsPlaceholder: "例如：\n展厅入口.jpg\n重点展品.jpg\n导览图.png\n预约票务.jpg"
    },
    product: {
      folderPlaceholder: "/Users/wanglujie/Desktop/特产文创素材",
      source: "产品实拍",
      tags: "例如：特产, 文创, 包装, 产地, 礼盒",
      suitable: "例如：产品种草 / 工艺故事 / 礼盒转化 / 规格价格",
      risk: "例如：产地、规格、价格、库存和资质需确认",
      singleTags: "例如：产品, 包装, 原料, 产地, 礼盒",
      singleSuitable: "例如：产品封面 / 产地故事 / 规格价格 / FAQ",
      singleRisk: "产地需确认 / 不夸大功效 / 包装规格不得改变",
      stylePlaceholder: "粘贴 xiaohongshu_auto_op 对同类型特产/文创图片风格的搜索和分析结果",
      assetsDirPlaceholder: "/path/to/assets/特产文创/本篇笔记",
      imagePathsPlaceholder: "例如：\n产品包装.jpg\n产地原料.jpg\n礼盒.jpg\n规格价格.png"
    },
    service: {
      folderPlaceholder: "/Users/wanglujie/Desktop/本地服务素材",
      source: "真实素材",
      tags: "例如：服务流程, 门店空间, 设备, 授权案例",
      suitable: "例如：服务项目 / 流程说明 / 价格预约 / FAQ",
      risk: "例如：案例授权、隐私、资质和价格需确认",
      singleTags: "例如：流程, 设备, 空间, 资质, 案例授权",
      singleSuitable: "例如：服务封面 / 流程图 / 价格卡 / FAQ",
      singleRisk: "案例需授权 / 不夸大效果 / 隐私需处理",
      stylePlaceholder: "粘贴 xiaohongshu_auto_op 对同类型本地服务图片风格的搜索和分析结果",
      assetsDirPlaceholder: "/path/to/assets/本地服务/本篇笔记",
      imagePathsPlaceholder: "例如：\n门店空间.jpg\n服务流程.jpg\n设备资质.jpg\n价格表.png"
    }
  };
  return copies[mode];
}

function weeklyUiCopy(accountType?: string) {
  const mode = accountUiMode(accountType);
  const copies = {
    culture_tourism: {
      ratio: "目的地种草2 / 动线攻略1 / 活动转化1",
      test: "例：真实目的地图 + 动线信息是否比单纯风景图更容易被收藏。",
      conversion: "例：轻量提到票务、活动报名、游线产品或服务咨询。",
      interaction: "例：引导用户留言出行日期、同行人、交通方式和想看的体验。",
      assets: "可粘贴目的地图、活动现场图、导览图、票务截图路径；或写：缺动线图/缺票务信息。"
    },
    heritage: {
      ratio: "工艺故事2 / 活动体验1 / 预约转化1",
      test: "例：真实工艺细节 + 体验流程是否比单纯作品图更容易被收藏。",
      conversion: "例：轻量提到体验预约、研学课程、节庆活动或文创购买。",
      interaction: "例：引导用户留言想体验的工艺、出行日期、是否亲子/研学。",
      assets: "可粘贴工艺细节、作品、活动现场、授权人物图路径；或写：缺授权图/缺预约信息。"
    },
    stay: {
      ratio: "房型空间2 / 周边体验1 / 价格问答1",
      test: "例：真实房型 + 周边玩法是否比单纯美图更容易带来咨询。",
      conversion: "例：轻量提到订房、套餐、团建或亲子活动。",
      interaction: "例：引导用户留言日期、人数、预算、亲子/宠物/停车需求。",
      assets: "可粘贴房间、窗景、公共区、早餐、周边体验图路径；或写：缺价格/缺房态。"
    },
    food: {
      ratio: "单菜品2 / 营销活动1 / 当地特色1 / 环境交通1",
      test: "例：用真实菜品文件名自动匹配图文，是否比人工挑图更稳定。",
      conversion: "例：轻量提到团购、预约、套餐、活动期限或到店路线。",
      interaction: "例：引导用户留言想吃哪道菜、人数、预算、忌口、停车交通问题。",
      assets: "可粘贴龙虾所在电脑上的图片文件夹路径；图片名建议为菜品名/环境名，如 清蒸鲈鱼.jpg、包间.jpg、停车场入口.jpg。"
    },
    outdoor: {
      ratio: "路线日记2 / 攻略收藏1 / 装备复盘1",
      test: "例：路线图 + 现场图是否比单纯风景图更容易被收藏。",
      conversion: "例：轻量提到路线合集、装备清单、资料包或社群。",
      interaction: "例：引导用户留言体力基础、出发季节、交通和装备问题。",
      assets: "可粘贴路线图、轨迹截图、现场图路径；或写：缺轨迹图/缺路况图。"
    },
    museum: {
      ratio: "展览看点2 / 研学攻略1 / 票务问答1",
      test: "例：真实展品图 + 观展动线是否比单张海报更容易收藏。",
      conversion: "例：轻量提到票务预约、讲解服务、研学课程或文创。",
      interaction: "例：引导用户留言观展时间、孩子年龄、是否需要讲解。",
      assets: "可粘贴展品授权图、展厅图、导览图、票务截图路径；或写：缺展期/缺拍摄规则。"
    },
    product: {
      ratio: "产品种草2 / 工艺故事1 / 礼盒转化1",
      test: "例：真实产品图 + 规格价格卡是否比氛围图更容易带来咨询。",
      conversion: "例：轻量提到购买方式、团购、伴手礼或文旅联动。",
      interaction: "例：引导用户留言用途、预算、口味偏好和送礼对象。",
      assets: "可粘贴产品图、包装图、产地图、价格规格图路径；或写：缺产地/缺规格。"
    },
    service: {
      ratio: "服务项目2 / 案例过程1 / 价格问答1",
      test: "例：真实服务流程 + 价格边界是否比案例图更容易建立信任。",
      conversion: "例：轻量提到预约、套餐、会员或本地咨询。",
      interaction: "例：引导用户留言预算、时间、顾虑和是否需要预约。",
      assets: "可粘贴门店空间、服务流程、设备资质、授权案例路径；或写：缺授权/缺价格。"
    }
  };
  return copies[mode];
}

function weeklyFocusCopy(accountType?: string) {
  const mode = accountUiMode(accountType);
  const copies = {
    culture_tourism: {
      label: "本周是否有特殊活动 / 目的地要推荐？",
      placeholder: "例如：周末夜游活动 / 暑期亲子套票 / 新开放的古街区；没有就留空，系统会自动排一周计划。",
      help: "留空时按文旅目的地的自动计划执行。"
    },
    heritage: {
      label: "本周是否有特殊民俗活动 / 非遗体验要推荐？",
      placeholder: "例如：蓝染体验课 / 周末民俗节 / 亲子手作活动；没有就留空，系统会自动排一周计划。",
      help: "留空时按民俗/非遗的自动计划执行。"
    },
    stay: {
      label: "本周是否有特殊房型 / 套餐 / 周边活动？",
      placeholder: "例如：亲子房暑期套餐 / 露营烧烤夜 / 周末双人房优惠；没有就留空。",
      help: "留空时按住宿/营地的自动计划执行。"
    },
    food: {
      label: "本周是否有特殊活动 / 主推菜 / 当地特色要推荐？",
      placeholder: "例如：本周主推清蒸鲈鱼；周末双人套餐；安吉本地竹林土鸡；没有就留空，系统会自动排计划。",
      help: "填写后，本周内容会优先围绕这个菜品、活动或当地特色生成；留空则按自动计划执行。"
    },
    outdoor: {
      label: "本周是否有特殊路线 / 活动要推荐？",
      placeholder: "例如：周末新手轻徒步路线 / 海岸线活动 / 端午路线合集；没有就留空。",
      help: "留空时按户外路线的自动计划执行。"
    },
    museum: {
      label: "本周是否有特殊展览 / 研学活动要推荐？",
      placeholder: "例如：新展开展 / 周末亲子讲解 / 暑期研学课；没有就留空。",
      help: "留空时按展馆研学的自动计划执行。"
    },
    product: {
      label: "本周是否有特殊产品 / 礼盒要推荐？",
      placeholder: "例如：端午伴手礼 / 新款文创冰箱贴 / 地域特产礼盒；没有就留空。",
      help: "留空时按产品/文创的自动计划执行。"
    },
    service: {
      label: "本周是否有特殊服务 / 套餐要推荐？",
      placeholder: "例如：暑期体验课 / 新客套餐 / 周末预约名额；没有就留空。",
      help: "留空时按本地服务的自动计划执行。"
    }
  };
  return copies[mode];
}

type WeeklyPreset = {
  name: string;
  help: string;
  theme: string;
  goal: string;
  frequency: number;
  ratio: string;
  testHypothesis: string;
  commercializationMove: string;
  interactionGoal: string;
  availableAssets: string;
};

function uniqueJoin(values: string[], separator = "；") {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).join(separator);
}

function combineRatio(values: string[]) {
  return uniqueJoin(
    values.flatMap((value) =>
      value
        .split("/")
        .map((item) => item.trim())
        .filter(Boolean)
    ),
    " / "
  );
}

function combineWeeklyPresets(presets: WeeklyPreset[]): WeeklyPreset {
  const active = presets.length ? presets : [weeklyPresets("restaurant")[0]];
  if (active.length === 1) return active[0];
  const names = active.map((preset) => preset.name);
  const maxFrequency = Math.max(...active.map((preset) => Number(preset.frequency || 3)));
  return {
    name: names.join(" + "),
    help: uniqueJoin(active.map((preset) => preset.help)),
    theme: `${names.join(" + ")}综合周`,
    goal: uniqueJoin(active.map((preset) => preset.goal)),
    frequency: Math.min(7, maxFrequency + Math.min(active.length - 1, 2)),
    ratio: combineRatio(active.map((preset) => preset.ratio)),
    testHypothesis: uniqueJoin(active.map((preset) => preset.testHypothesis), "\n"),
    commercializationMove: uniqueJoin(active.map((preset) => preset.commercializationMove), "\n"),
    interactionGoal: uniqueJoin(active.map((preset) => preset.interactionGoal), "\n"),
    availableAssets: uniqueJoin(active.map((preset) => preset.availableAssets), "\n")
  };
}

function emptyAccountForm(templates: Template[]) {
  return {
    name: "",
    accountParam: "",
    accountType: templates[0]?.typeKey || "restaurant",
    stage: "冷启动",
    personaBase: "",
    city: "",
    targetUsers: "",
    painPoints: "",
    contentDirections: "",
    businessGoals: "",
    monetization: "",
    referenceAccounts: "",
    materialCondition: "",
    taboos: ""
  };
}

function accountTypeDefaults(accountType: string, template?: Template) {
  const columns = template ? safeJsonArray(template.defaultColumns).join("、") : "";
  const common = {
    targetUsers: "有明确需求、正在比较选择、希望先看真实案例和价格边界的用户",
    painPoints: "不知道是否靠谱、价格是否透明、案例是否真实、怎么预约、效果是否能落地",
    contentDirections: columns || "真实案例、服务流程、价格问答、用户顾虑、素材展示",
    businessGoals: "提升收藏、增加咨询、建立信任、促进预约或到店转化",
    monetization: "咨询转化、预约服务、套餐成交、私域跟进",
    materialCondition: "门店/现场图、服务过程图、案例图、产品图、环境图、价格或活动信息图",
    taboos: "不能伪造真实案例、顾客评价、价格、优惠、资质、档期、素材授权或服务效果"
  };

  if (accountType === "restaurant") {
    return {
      targetUsers: "本地到店用户、游客、家庭聚餐用户、朋友聚会用户、想找特色餐厅的用户",
      painPoints: "不知道点什么、价格是否清楚、环境是否适合、停车交通是否方便、活动规则是否真实",
      contentDirections: "招牌菜种草、套餐场景、门店环境、菜单上新、在地风味、停车交通、顾客问答",
      businessGoals: "增加到店咨询、提升团购/套餐转化、推广主推菜、提升收藏和评论",
      monetization: "团购转化、预约到店、套餐售卖、节日活动、私域会员",
      materialCondition: "菜品图、菜单/价格表、包间/大厅图、门头图、停车场入口图、活动海报",
      taboos: "不能伪造探店、排队火爆、顾客评价、价格优惠、食材等级、营业时间或停车便利性"
    };
  }

  if (accountType === "local_life_service") {
    return {
      targetUsers: "有明确本地服务需求、正在比较门店、希望先看真实案例和价格边界的用户",
      painPoints: "预算不透明、案例是否真实、现场效果是否落地、流程是否省心、服务是否靠谱",
      contentDirections: "真实案例、服务流程、风格细节、预算避坑、门店空间、预约问答、客户顾虑",
      businessGoals: "增加咨询、提升预约、展示案例、建立信任、促进到店沟通",
      monetization: "服务咨询、套餐预约、到店沟通、定制方案、私域跟进",
      materialCondition: "真实案例图、服务过程图、场地/门店环境图、客户授权图、价格套餐图、短视频素材",
      taboos: "不能伪造真实客户案例，不能使用未授权肖像，不能夸大服务效果，不能虚构价格、档期和资质"
    };
  }

  if (accountType === "cultural_tourism_destination") {
    return {
      targetUsers: "周末游客、亲子家庭、研学机构、城市微度假用户、外地旅行用户",
      painPoints: "值不值得去、怎么玩、交通票务是否方便、开放时间是否准确、是否适合亲子或拍照",
      contentDirections: "目的地动线、核心看点、活动现场、拍照机位、交通票务、避坑问答",
      businessGoals: "提升收藏、增加咨询、促进票务/活动/路线转化",
      monetization: "票务、活动报名、线路产品、研学团建、本地商户转化",
      materialCondition: "现场图、导览图、票务截图、活动海报、交通图、服务信息图",
      taboos: "不能伪造开放状态、活动现场、人流热度、票价、交通和游客肖像授权"
    };
  }

  if (accountType === "hiking_diary") {
    return {
      targetUsers: "想找靠谱路线的新手户外用户、进阶徒步用户、周末出行用户",
      painPoints: "不知道路线难度、距离爬升、交通补给、季节窗口、是否适合自己",
      contentDirections: "路线日记、路线攻略、风景图集、装备复盘、交通补给、安全提醒",
      businessGoals: "提升收藏、增加路线咨询、沉淀关注和路线资料需求",
      monetization: "路线资料包、社群活动、装备合作、旅行咨询",
      materialCondition: "路线图、轨迹截图、真实现场图、关键路况图、装备图、交通补给截图",
      taboos: "不能伪造亲历、登顶、轨迹数据、天气、开放状态、危险路况或他人评价"
    };
  }

  return common;
}

function accountChoiceOptions(accountType: string) {
  const common = {
    targetUsers: ["正在比较选择的用户", "希望先看真实案例的用户", "关注价格边界的用户", "本地到店咨询用户", "新客户"],
    businessGoals: ["提升收藏", "增加咨询", "建立信任", "促进预约", "促进到店转化", "沉淀私域"],
    materialCondition: ["门店/现场图", "服务过程图", "真实案例图", "产品图", "环境图", "价格或活动信息图"],
    taboos: ["不伪造真实案例", "不伪造顾客评价", "不虚构价格/优惠", "不夸大服务效果", "不使用未授权素材"]
  };

  if (accountType === "restaurant") {
    return {
      targetUsers: ["本地到店用户", "游客", "家庭聚餐用户", "朋友聚会用户", "团建/宴请用户", "想找特色餐厅的用户"],
      businessGoals: ["增加到店咨询", "提升团购转化", "推广主推菜", "推广套餐", "提升收藏", "增加评论互动"],
      materialCondition: ["菜品图", "菜单/价格表", "包间图", "大厅图", "门头图", "停车场入口图", "活动海报"],
      taboos: ["不伪造探店", "不伪造排队火爆", "不伪造顾客评价", "不虚构价格优惠", "不夸大食材等级", "不乱写营业时间/停车"]
    };
  }

  if (accountType === "local_life_service") {
    return {
      targetUsers: ["准备结婚的新人", "正在比较服务的客户", "重视审美风格的用户", "需要预算透明的用户", "本地到店咨询用户", "老客转介绍用户"],
      businessGoals: ["增加咨询", "提升预约", "展示真实案例", "建立信任", "推广套餐/活动", "促进到店沟通"],
      materialCondition: ["真实案例图", "服务过程图", "门店/场地环境图", "客户授权图", "价格套餐图", "短视频素材", "资质/证书图"],
      taboos: ["不伪造客户案例", "不使用未授权肖像", "不虚构价格/档期", "不夸大服务效果", "不伪造顾客评价", "不泄露客户隐私"]
    };
  }

  if (accountType === "cultural_tourism_destination") {
    return {
      targetUsers: ["周末游客", "亲子家庭", "研学机构", "城市微度假用户", "外地旅行用户", "拍照打卡用户"],
      businessGoals: ["提升收藏", "增加咨询", "促进票务转化", "促进活动报名", "推广路线", "提升目的地认知"],
      materialCondition: ["现场图", "导览图", "票务截图", "活动海报", "交通图", "服务信息图", "游客授权图"],
      taboos: ["不伪造开放状态", "不虚构活动现场", "不夸大人流热度", "不乱写票价/时间", "不使用未授权游客肖像"]
    };
  }

  if (accountType === "hiking_diary") {
    return {
      targetUsers: ["新手户外用户", "进阶徒步用户", "周末出行用户", "想找靠谱路线的用户", "亲子户外用户", "装备党"],
      businessGoals: ["提升收藏", "增加路线咨询", "沉淀关注", "推广路线资料", "建立专业信任", "促进社群活动"],
      materialCondition: ["路线图", "轨迹截图", "真实现场图", "关键路况图", "装备图", "交通补给截图", "天气/开放状态截图"],
      taboos: ["不伪造亲历", "不伪造登顶", "不伪造轨迹数据", "不淡化安全风险", "不乱写天气/开放状态", "不改变真实路况"]
    };
  }

  return common;
}

function autoAccountParam(name: string, accountType: string, count = 0) {
  const latin = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  if (latin) return latin;
  const prefix = accountType.split("_")[0] || "brand";
  return `${prefix}-${String(count + 1).padStart(2, "0")}`;
}

function hydrateAccountForm(form: ReturnType<typeof emptyAccountForm>, templates: Template[], count = 0) {
  const template = templates.find((item) => item.typeKey === form.accountType);
  const defaults = accountTypeDefaults(form.accountType, template);
  const typeName = template?.name || "小红书运营客户";
  const personaBase =
    form.personaBase.trim() ||
    `${form.name || "该客户"}是${form.city ? `${form.city}的` : ""}${typeName}客户，需要通过真实素材、真实案例和清楚的服务信息运营小红书账号。`;

  return {
    ...form,
    accountParam: form.accountParam.trim() || autoAccountParam(form.name, form.accountType, count),
    personaBase,
    targetUsers: form.targetUsers.trim() || defaults.targetUsers,
    painPoints: form.painPoints.trim() || defaults.painPoints,
    contentDirections: form.contentDirections.trim() || defaults.contentDirections,
    businessGoals: form.businessGoals.trim() || defaults.businessGoals,
    monetization: form.monetization.trim() || defaults.monetization,
    materialCondition: form.materialCondition.trim() || defaults.materialCondition,
    taboos: form.taboos.trim() || defaults.taboos
  };
}

export function XhsMasterApp() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number][0]>("dashboard");
  const [accountForm, setAccountForm] = useState(emptyAccountForm([]));
  const [profileContent, setProfileContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [promptResults, setPromptResults] = useState<Record<number, PromptResult>>({});
  const [imagePromptResults, setImagePromptResults] = useState<Record<number, ImagePromptResult>>({});
  const [weddingImagePlanResults, setWeddingImagePlanResults] = useState<Record<number, WeddingImagePlanResult>>({});
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [manifest, setManifest] = useState<{ content: string; validation: string; path: string } | null>(null);
  const [referenceDraft, setReferenceDraft] = useState<{
    research?: ReferenceResearch;
    commands?: Array<{ category: string; command: string; description: string; safetyNote: string }>;
    researchPrompt?: string;
    summary?: { summaryMarkdown: string; contentFeatures: string; personaInsights: string; strategyInsights: string };
  }>({});
  const [imageStyleDraft, setImageStyleDraft] = useState<{
    study?: ImageStyleStudy;
    commands?: Array<{ category: string; command: string; description: string; safetyNote: string }>;
    researchPrompt?: string;
    summary?: { summaryMarkdown: string; styleBrief: string[] };
  }>({});
  const [interactionDraft, setInteractionDraft] = useState<{
    plan?: InteractionPlan;
    commands?: Array<{ category: string; command: string; description: string; safetyNote: string }>;
    discoveryPrompt?: string;
    commentPrompt?: string;
    summary?: { targetUsersMarkdown: string; commentDraftsMarkdown: string };
  }>({});

  const selected = useMemo(() => accounts.find((account) => account.id === selectedId) ?? accounts[0], [accounts, selectedId]);
  const latestPlan = selected?.weeklyPlans?.[0];
  const selectedNote = latestPlan?.noteTasks?.find((task) => task.id === selectedNoteId) ?? latestPlan?.noteTasks?.[0];

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (templates.length && !accountForm.accountType) setAccountForm(emptyAccountForm(templates));
  }, [templates, accountForm.accountType]);

  useEffect(() => {
    if (selected?.profile?.content) setProfileContent(selected.profile.content);
    if (selected && selectedId === null) setSelectedId(selected.id);
    if (latestPlan?.noteTasks?.[0] && !selectedNoteId) setSelectedNoteId(latestPlan.noteTasks[0].id);
  }, [selected, selectedId, latestPlan, selectedNoteId]);

  async function refresh() {
    const res = await fetch("/api/accounts", { cache: "no-store" });
    const data = await res.json();
    setAccounts(data.accounts);
    setTemplates(data.templates);
    if (!selectedId && data.accounts[0]) setSelectedId(data.accounts[0].id);
    if (data.templates?.length) setAccountForm((current) => (current.accountType ? current : emptyAccountForm(data.templates)));
  }

  async function createAccount() {
    setLoading(true);
    try {
      const payload = hydrateAccountForm(accountForm, templates, accounts.length);
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "创建失败");
      await refresh();
      setSelectedId(data.id);
      setActiveTab("strategy");
      setAccountForm(emptyAccountForm(templates));
      showToast("账号、策划案和配置文件已生成。");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "创建失败");
    } finally {
      setLoading(false);
    }
  }

  async function deleteAccount() {
    if (!selected) return;
    const confirmed = window.confirm(
      `确定删除账号「${selected.name}」吗？\n\n会删除数据库中的账号、策划案、计划、草稿和素材记录。\n不会物理删除本地 profiles/ 和 assets/ 文件。`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "删除账号失败。");
      setSelectedId(data.nextAccountId ?? null);
      setSelectedNoteId(null);
      setPromptResults({});
      setReferenceDraft({});
      setImageStyleDraft({});
      setInteractionDraft({});
      await refresh();
      setActiveTab(data.nextAccountId ? "dashboard" : "accounts");
      showToast(data.note || "账号已删除。");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除账号失败。");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!selected) return;
    setLoading(true);
    await fetch(`/api/accounts/${selected.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profileContent })
    });
    await refresh();
    setLoading(false);
    showToast("配置文件已保存。");
  }

  async function uploadAsset(form: HTMLFormElement) {
    if (!selected) return;
    const data = new FormData(form);
    data.set("accountId", String(selected.id));
    setLoading(true);
    const res = await fetch("/api/assets/upload", { method: "POST", body: data });
    if (res.ok) {
      const result = await res.json().catch(() => ({ count: 1 }));
      form.reset();
      await refresh();
      showToast(`已上传 ${result.count || 1} 个素材到 assets 目录。`);
    } else {
      showToast("上传失败。");
    }
    setLoading(false);
  }

  async function importAssetFolder(form: HTMLFormElement) {
    if (!selected) return;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    setLoading(true);
    try {
      const res = await fetch("/api/assets/import-folder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, accountId: selected.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "登记文件夹失败。");
      await refresh();
      showToast(`已登记 ${data.imported} 个素材，跳过 ${data.skipped} 个已存在文件。`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "登记文件夹失败。");
    } finally {
      setLoading(false);
    }
  }

  async function generateManifest() {
    if (!selected) return;
    const res = await fetch("/api/assets/manifest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accountId: selected.id })
    });
    const data = await res.json();
    setManifest(data);
    showToast("素材清单已生成。");
  }

  async function generateWeeklyPlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries()) as Record<string, FormDataEntryValue>;
    const weeklyFocus = String(payload.weeklyFocus || "").trim();
    if (weeklyFocus) {
      payload.theme = `${String(payload.theme || "本周主题")}｜本周重点：${weeklyFocus}`;
      payload.goal = `${String(payload.goal || "验证内容方向并积累可复用素材")}；优先围绕本周重点「${weeklyFocus}」安排内容。`;
      payload.availableAssets = [String(payload.availableAssets || ""), `本周特殊活动/主推内容：${weeklyFocus}`].filter(Boolean).join("\n");
      payload.testHypothesis = `本周验证「${weeklyFocus}」是否能带来更高点击、收藏、评论咨询或到店转化。`;
      payload.commercializationMove = `围绕「${weeklyFocus}」轻量提示预约、到店、活动期限、套餐权益或咨询入口；所有价格、活动和库存必须人工确认。`;
      payload.interactionGoal = `引导用户围绕「${weeklyFocus}」留言人数、预算、时间、偏好、忌口或交通问题。`;
    }
    setLoading(true);
    showToast("正在生成一周计划...");
    try {
      const res = await fetch("/api/weekly-plans/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, accountId: selected.id })
      });
      const plan = await res.json();
      if (!res.ok) throw new Error(plan.error || "生成计划失败。");
      await refresh();
      setSelectedNoteId(plan.noteTasks?.[0]?.id ?? null);
      setActiveTab("prompts");
      showToast("本周内容计划已生成。");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "生成计划失败。");
    } finally {
      setLoading(false);
    }
  }

  async function prepareReferenceResearch() {
    if (!selected) return;
    setLoading(true);
    const res = await fetch(`/api/accounts/${selected.id}/reference-research`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "prepare" })
    });
    const data = await res.json();
    setReferenceDraft({ research: data.research, commands: data.commands, researchPrompt: data.researchPrompt });
    await refresh();
    setLoading(false);
    showToast("爆款参考包已生成。");
  }

  async function saveReferenceResearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    setLoading(true);
    const res = await fetch(`/api/accounts/${selected.id}/reference-research`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "save-results",
        researchId: referenceDraft.research?.id || selected.referenceResearches?.[0]?.id,
        ...payload
      })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "保存参考账号研究失败。");
      setLoading(false);
      return;
    }
    setReferenceDraft((current) => ({ ...current, research: data.research, summary: data.summary }));
    await refresh();
    setProfileContent(data.account?.profile?.content || profileContent);
    setLoading(false);
    showToast("已基于爆款参考增强策划案和配置文件。");
  }

  async function prepareImageStyleStudy() {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}/image-style-study`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "prepare" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成图片风格研究包失败。");
      setImageStyleDraft({ study: data.study, commands: data.commands, researchPrompt: data.researchPrompt });
      await refresh();
      showToast("图片风格研究已生成。");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "生成图片风格研究包失败。");
    } finally {
      setLoading(false);
    }
  }

  async function saveImageStyleStudy(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}/image-style-study`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "save-results",
          studyId: imageStyleDraft.study?.id || selected.imageStyleStudies?.[0]?.id,
          ...payload
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存图片风格研究失败。");
      setImageStyleDraft((current) => ({ ...current, study: data.study, summary: data.summary }));
      await refresh();
      showToast(data.warning || "图片风格研究已总结，后续图片方案会自动引用。");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "保存图片风格研究失败。");
    } finally {
      setLoading(false);
    }
  }

  async function prepareInteractionPlan(noteTaskId?: number | null, options?: { publishedNoteUrl?: string; interactionGoal?: string }) {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}/interaction-plan`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "prepare",
          noteTaskId: noteTaskId || selectedNote?.id || null,
          publishedNoteUrl: options?.publishedNoteUrl || "",
          interactionGoal: options?.interactionGoal || ""
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成目标用户互动研究包失败。");
      setInteractionDraft({
        plan: data.plan,
        commands: data.commands,
        discoveryPrompt: data.discoveryPrompt,
        commentPrompt: data.commentPrompt
      });
      await refresh();
      showToast("已发布笔记互动建议已生成。");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "生成目标用户互动研究包失败。");
    } finally {
      setLoading(false);
    }
  }

  async function saveInteractionResults(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}/interaction-plan`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "save-results",
          planId: interactionDraft.plan?.id || selected.interactionPlans?.[0]?.id,
          noteTaskId: selectedNote?.id || null,
          ...payload
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存目标用户互动结果失败。");
      setInteractionDraft((current) => ({ ...current, plan: data.plan, summary: data.summary }));
      await refresh();
      showToast(data.warning || "目标用户互动策略已生成。");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "保存目标用户互动结果失败。");
    } finally {
      setLoading(false);
    }
  }

  async function generatePrompt(task: NoteTask) {
    setLoading(true);
    const res = await fetch(`/api/note-tasks/${task.id}/prompt`, { method: "POST" });
    const data = await res.json();
    setPromptResults((current) => ({ ...current, [task.id]: data }));
    await refresh();
    setLoading(false);
    showToast("正文草稿和执行命令已生成。");
  }

  async function generateImagePrompt(task: NoteTask, options?: { openclawAssetsDir?: string; openclawImagePaths?: string }) {
    setLoading(true);
    try {
      const res = await fetch(`/api/note-tasks/${task.id}/image-prompt`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(options || {})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成图片方案失败。");
      setImagePromptResults((current) => ({ ...current, [task.id]: data }));
      showToast("图片方案和执行命令已生成。");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "生成图片方案失败。");
    } finally {
      setLoading(false);
    }
  }

  async function generateWeddingImagePlan(options?: { weeks?: string; openclawAssetsDir?: string; openclawImagePaths?: string; planningGoal?: string }) {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}/wedding-image-plan`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(options || {})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成婚礼批量图片规划失败。");
      setWeddingImagePlanResults((current) => ({ ...current, [selected.id]: data }));
      showToast("婚礼批量图片选题规划 Prompt 已生成。");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "生成婚礼批量图片规划失败。");
    } finally {
      setLoading(false);
    }
  }

  async function saveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedNote) return;
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    setLoading(true);
    await fetch("/api/drafts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, noteTaskId: selectedNote.id })
    });
    await refresh();
    setLoading(false);
    showToast("草稿结果已保存。");
  }

  async function generateReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const rawRows = String(form.get("rows") || "");
    const rows = rawRows
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [title, impressions, clicks, likes, saves, comments, messages, conversions] = line.split(",").map((item) => item.trim());
        return { title, impressions, clicks, likes, saves, comments, messages, conversions };
      });
    setLoading(true);
    const res = await fetch("/api/weekly-reports/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        accountId: selected.id,
        weeklyPlanId: latestPlan?.id,
        weekLabel: form.get("weekLabel"),
        subjective: form.get("subjective"),
        rows
      })
    });
    const report = await res.json();
    setLoading(false);
    downloadText(`weekly-report-prompt-${selected.name}.md`, report.prompt);
    showToast("周报复盘建议已生成并下载。");
  }

  async function loadHealth() {
    const res = await fetch("/api/system-health", { cache: "no-store" });
    setHealth(await res.json());
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    showToast("已复制到剪贴板。");
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-ink/10 bg-white/80 px-4 py-5 shadow-panel backdrop-blur lg:block">
        <div className="mb-6">
          <div className="text-xl font-semibold">xhs-master-site</div>
          <div className="mt-2 inline-flex items-center gap-2 rounded bg-teal/10 px-2 py-1 text-xs font-medium text-teal">
            <ShieldCheck size={14} /> 只生成方案，不自动发布
          </div>
        </div>
        <nav className="space-y-1">
          {mainTabs.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveTab(id);
              }}
              className={clsx(
                "flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm transition",
                activeTab === id ? "bg-ink text-white" : "hover:bg-ink/5"
              )}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
          <details className="pt-2">
            <summary className="cursor-pointer rounded px-3 py-2 text-xs font-medium text-ink/55 transition hover:bg-ink/5">
              高级设置
            </summary>
            <div className="mt-1 space-y-1">
              {advancedTabs.map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setActiveTab(id);
                    if (id === "health") loadHealth();
                  }}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm transition",
                    activeTab === id ? "bg-ink text-white" : "hover:bg-ink/5"
                  )}
                >
                  <Icon size={17} />
                  {label}
                </button>
              ))}
            </div>
          </details>
        </nav>
      </aside>

      <main className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm text-ink/60">多账号类型小红书安全运营台</div>
              <h1 className="text-2xl font-semibold">{selected?.name || "创建第一个账号"}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selected?.id ?? ""}
                onChange={(event) => setSelectedId(Number(event.target.value))}
                className="h-10 rounded border border-ink/15 bg-white px-3 text-sm"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} / {account.accountParam}
                  </option>
                ))}
              </select>
              <button title="刷新" type="button" onClick={refresh} className="icon-button">
                <Activity size={17} />
              </button>
            </div>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {mainTabs.map(([id, label]) => (
              <button key={id} type="button" onClick={() => setActiveTab(id)} className={clsx("shrink-0 rounded px-3 py-2 text-sm", activeTab === id ? "bg-ink text-white" : "bg-white")}>
                {label}
              </button>
            ))}
          </div>
        </header>

        <section className="px-4 py-6 lg:px-8">
          {toast && <div className="fixed right-5 top-5 z-50 rounded bg-ink px-4 py-2 text-sm text-white shadow-panel">{toast}</div>}
          {activeTab === "dashboard" && <Dashboard selected={selected} setActiveTab={setActiveTab} deleteAccount={deleteAccount} loading={loading} />}
          {activeTab === "accounts" && (
            <AccountsPanel
              templates={templates}
              accountForm={accountForm}
              setAccountForm={setAccountForm}
              createAccount={createAccount}
              loading={loading}
            />
          )}
          {activeTab === "reference" && (
            <ReferenceResearchPanel
              selected={selected}
              draft={referenceDraft}
              prepareReferenceResearch={prepareReferenceResearch}
              saveReferenceResearch={saveReferenceResearch}
              copy={copy}
              loading={loading}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === "strategy" && <StrategyPanel selected={selected} copy={copy} />}
          {activeTab === "agents" && (
            <AgentsPanel
              selected={selected}
              profileContent={profileContent}
              setProfileContent={setProfileContent}
              saveProfile={saveProfile}
              copy={copy}
            />
          )}
          {activeTab === "assets" && (
            <AssetsPanel
              selected={selected}
              uploadAsset={uploadAsset}
              importAssetFolder={importAssetFolder}
              generateManifest={generateManifest}
              manifest={manifest}
              copy={copy}
            />
          )}
          {activeTab === "weekly" && <WeeklyPanel selected={selected} generateWeeklyPlan={generateWeeklyPlan} loading={loading} />}
          {activeTab === "images" && (
            <ImagesPanel
              selected={selected}
              plan={latestPlan}
              selectedNoteId={selectedNote?.id ?? null}
              setSelectedNoteId={setSelectedNoteId}
              imageStyleDraft={imageStyleDraft}
              prepareImageStyleStudy={prepareImageStyleStudy}
              saveImageStyleStudy={saveImageStyleStudy}
              imagePromptResults={imagePromptResults}
              generateImagePrompt={generateImagePrompt}
              weddingImagePlanResult={selected ? weddingImagePlanResults[selected.id] : null}
              generateWeddingImagePlan={generateWeddingImagePlan}
              copy={copy}
              loading={loading}
            />
          )}
          {activeTab === "prompts" && (
            <PromptsPanel
              plan={latestPlan}
              selectedNoteId={selectedNote?.id ?? null}
              setSelectedNoteId={setSelectedNoteId}
              promptResults={promptResults}
              generatePrompt={generatePrompt}
              copy={copy}
            />
          )}
          {activeTab === "interactions" && (
            <InteractionsPanel
              selected={selected}
              latestPlan={latestPlan}
              selectedNoteId={selectedNote?.id ?? null}
              setSelectedNoteId={setSelectedNoteId}
              draft={interactionDraft}
              prepareInteractionPlan={prepareInteractionPlan}
              saveInteractionResults={saveInteractionResults}
              copy={copy}
              loading={loading}
            />
          )}
          {activeTab === "drafts" && <DraftPanel note={selectedNote} saveDraft={saveDraft} />}
          {activeTab === "reports" && <ReportsPanel generateReport={generateReport} latestPlan={latestPlan} />}
          {activeTab === "health" && <HealthPanel health={health} loadHealth={loadHealth} />}
        </section>
      </main>
    </div>
  );
}

function Dashboard({
  selected,
  setActiveTab,
  deleteAccount,
  loading
}: {
  selected?: Account;
  setActiveTab: (tab: any) => void;
  deleteAccount: () => void;
  loading: boolean;
}) {
  const cards = [
    ["账号策划", selected?.strategy ? "已可用" : "待创建", "strategy"],
    ["上传素材", `${selected?.assets?.length ?? 0}`, "assets"],
    ["本周内容", `${selected?.weeklyPlans?.[0]?.noteTasks?.length ?? 0} 篇`, "weekly"],
    ["图片方案", selected?.weeklyPlans?.[0]?.noteTasks?.length ? "可生成" : "待计划", "images"],
    ["笔记草稿", selected?.weeklyPlans?.[0]?.noteTasks?.length ? "可生成" : "待计划", "prompts"],
    ["发布互动", selected?.interactionPlans?.[0]?.status || "可选", "interactions"]
  ];
  const optionalCards = [
    ["爆款参考", selected?.referenceResearches?.[0]?.status || "可选增强", "reference"],
    ["配置文件", selected?.profile ? `v${selected.profile.version}` : "自动生成", "agents"]
  ];
  return (
    <div className="space-y-5">
      <div className="panel flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="section-title">账号运营工作台</h2>
          <p className="mt-1 text-sm text-ink/60">
            {selected ? `当前账号：${selected.name} / ${selected.accountParam}` : "还没有账号，先创建一个账号策划。"}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => setActiveTab("accounts")} className="primary-button w-full justify-center sm:w-auto">
            <Plus size={17} /> 新增账号
          </button>
          <button
            type="button"
            onClick={deleteAccount}
            disabled={!selected || loading}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded border border-coral/35 bg-white px-4 text-sm font-medium text-coral transition hover:bg-coral/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Trash2 size={17} /> 删除当前账号
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map(([label, value, tab]) => (
          <button key={label} type="button" onClick={() => setActiveTab(tab)} className="panel text-left">
            <div className="text-sm text-ink/55">{label}</div>
            <div className="mt-3 text-2xl font-semibold">{value}</div>
          </button>
        ))}
      </div>
      <div className="panel">
        <div className="mb-3">
          <h2 className="text-lg font-semibold">可选增强</h2>
          <p className="mt-1 text-sm text-ink/60">
            创建账号后策划已经可用，可以直接进入素材、本周内容、图片方案和笔记草稿。爆款参考只在需要校准同行风格时再做。
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {optionalCards.map(([label, value, tab]) => (
            <button key={label} type="button" onClick={() => setActiveTab(tab)} className="rounded border border-ink/10 bg-white p-3 text-left transition hover:border-teal/40 hover:bg-teal/5">
              <div className="text-sm text-ink/55">{label}</div>
              <div className="mt-1 text-lg font-semibold">{value}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="panel">
        <div className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <ShieldCheck size={20} /> 统一执行原则
        </div>
        <div className="grid gap-3 text-sm text-ink/75 md:grid-cols-2">
          {["只生成草稿和执行建议", "默认安全模式", "不直接执行真实发布", "按账号类型切换图片规则", "AI 改图必须基于真实素材", "不伪造亲历、探店、轨迹、顾客反馈或素材授权"].map((item) => (
            <div key={item} className="rounded border border-ink/10 bg-white px-3 py-2">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AccountsPanel(props: {
  templates: Template[];
  accountForm: ReturnType<typeof emptyAccountForm>;
  setAccountForm: (form: any) => void;
  createAccount: () => void;
  loading: boolean;
}) {
  const { templates, accountForm, setAccountForm, createAccount, loading } = props;
  const field = (key: keyof typeof accountForm, value: string) => setAccountForm({ ...accountForm, [key]: value });
  const selectedTemplate = templates.find((template) => template.typeKey === accountForm.accountType);
  const defaults = accountTypeDefaults(accountForm.accountType, selectedTemplate);
  const choices = accountChoiceOptions(accountForm.accountType);
  const fillDefaults = () => setAccountForm(hydrateAccountForm(accountForm, templates));
  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="panel">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="section-title">快速创建客户账号</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/60">
              只需要先填客户是谁、做什么、在哪、想吸引谁。空白的细节会按账号类型自动补齐，后面还能再改。
            </p>
          </div>
          <button type="button" onClick={fillDefaults} className="secondary-button">
            <Sparkles size={17} /> 自动补全空白项
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input label="客户/账号名称" value={accountForm.name} onChange={(v) => field("name", v)} placeholder="例如 灼悦婚礼 / 长歌行 / X 的徒步日记" />
          <Input label="所在城市/区域" value={accountForm.city} onChange={(v) => field("city", v)} placeholder="例如 杭州 / 大理 / 上海静安" />
          <label className="field md:col-span-2">
            <span>客户类型</span>
            <select value={accountForm.accountType} onChange={(e) => field("accountType", e.target.value)}>
              {templates.map((template) => (
                <option key={template.typeKey} value={template.typeKey}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          <Textarea
            label="客户主要做什么"
            value={accountForm.personaBase}
            onChange={(v) => field("personaBase", v)}
            placeholder="一句话写清主营业务、核心服务或核心体验。例如：本地婚礼服务品牌，提供婚礼策划、现场布置和真实案例展示。"
            help="不会写可以先空着，系统会按客户类型自动补一句基础描述。"
          />
          <MultiChoiceField
            label="想吸引谁"
            value={accountForm.targetUsers}
            onChange={(v) => field("targetUsers", v)}
            options={choices.targetUsers}
            placeholder="还有其他目标用户，可以写在这里"
          />
          <MultiChoiceField
            label="现在最想达成什么"
            value={accountForm.businessGoals}
            onChange={(v) => field("businessGoals", v)}
            options={choices.businessGoals}
            placeholder="还有其他目标，可以写在这里"
          />
          <MultiChoiceField
            label="已有素材"
            value={accountForm.materialCondition}
            onChange={(v) => field("materialCondition", v)}
            options={choices.materialCondition}
            placeholder="其他素材，例如航拍、直播切片、客户评价截图"
          />
          <MultiChoiceField
            label="不能乱写什么"
            value={accountForm.taboos}
            onChange={(v) => field("taboos", v)}
            options={choices.taboos}
            placeholder="其他禁忌或品牌红线"
            help="例如不能伪造案例、价格、优惠、顾客评价、肖像授权、真实到店或服务效果。"
          />
        </div>

        <details className="mt-4 rounded border border-ink/10 bg-white p-3">
          <summary className="cursor-pointer text-sm font-medium">
            高级补充
            <span className="ml-2 text-xs font-normal text-ink/50">需要更精细时再展开</span>
          </summary>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input
              label="内部账号代号"
              value={accountForm.accountParam}
              onChange={(v) => field("accountParam", v)}
              placeholder="可不填，系统会自动生成，例如 brand-01"
            />
            <label className="field">
              <span>账号阶段</span>
              <select value={accountForm.stage} onChange={(e) => field("stage", e.target.value)}>
                {["冷启动", "成长期", "商业化期"].map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
            </label>
            <Textarea label="用户顾虑" value={accountForm.painPoints} onChange={(v) => field("painPoints", v)} placeholder={defaults.painPoints} />
            <Textarea label="内容方向" value={accountForm.contentDirections} onChange={(v) => field("contentDirections", v)} placeholder={defaults.contentDirections} />
            <Textarea label="商业化方式" value={accountForm.monetization} onChange={(v) => field("monetization", v)} placeholder={defaults.monetization} />
            <Textarea label="参考账号" value={accountForm.referenceAccounts} onChange={(v) => field("referenceAccounts", v)} placeholder="账号名 / 主页链接 / 想参考的原因。不确定可以留空。" />
          </div>
        </details>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={createAccount} disabled={loading || !accountForm.name} className="primary-button">
            <Plus size={17} /> {loading ? "正在生成..." : "创建账号并生成策划"}
          </button>
          <span className="text-xs leading-5 text-ink/50">最少只填客户名称也能创建；填写主营业务和目标用户会更准。</span>
        </div>
      </div>
      <div className="panel">
        <h2 className="section-title">选择客户类型</h2>
        <p className="mt-1 text-sm text-ink/60">点选后，左侧占位示例和自动补全规则会跟着切换。</p>
        <div className="space-y-2">
          {templates.map((template) => (
            <button
              key={template.typeKey}
              type="button"
              onClick={() => field("accountType", template.typeKey)}
              className={clsx(
                "w-full rounded border bg-white p-3 text-left transition hover:border-teal/40 hover:bg-teal/5",
                accountForm.accountType === template.typeKey ? "border-teal/60 bg-teal/5 ring-2 ring-teal/15" : "border-ink/10"
              )}
            >
              <div className="font-medium">{template.name}</div>
              <div className="mt-1 text-xs text-ink/60">{safeJsonArray(template.defaultColumns).join(" / ")}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReferenceResearchPanel(props: {
  selected?: Account;
  draft: {
    research?: ReferenceResearch;
    commands?: Array<{ category: string; command: string; description: string; safetyNote: string }>;
    researchPrompt?: string;
    summary?: { summaryMarkdown: string; contentFeatures: string; personaInsights: string; strategyInsights: string };
  };
  prepareReferenceResearch: () => void;
  saveReferenceResearch: (event: React.FormEvent<HTMLFormElement>) => void;
  copy: (text: string) => void;
  loading: boolean;
  setActiveTab: (tab: any) => void;
}) {
  const { selected, draft, prepareReferenceResearch, saveReferenceResearch, copy, loading, setActiveTab } = props;
  if (!selected) return <EmptyState />;

  const latest = draft.research || selected.referenceResearches?.[0];
  const commands = draft.commands || (latest?.commandJson ? safeJsonArray(latest.commandJson) : []);
  const researchPrompt = draft.researchPrompt || latest?.researchPrompt || "";
  const summaryMarkdown = draft.summary?.summaryMarkdown || latest?.summaryMarkdown || "";
  const commandBundle = commands.map((command: any) => command.command).join("\n");
  const hasSearchPack = Boolean(commands.length || researchPrompt);
  const hasSummary = Boolean(summaryMarkdown.trim());

  return (
    <div className="space-y-5">
      <div className="panel">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="section-title">爆款参考增强（可选）</h2>
            <p className="mt-1 max-w-3xl text-sm text-ink/60">
              账号创建后策划已经可用；这页只在需要吸收同类型爆款风格、标题结构、图片顺序和评论痛点时使用。研究结果会增强后续策划、图片方案和正文草稿，但不阻塞主流程。
            </p>
          </div>
          <button type="button" onClick={prepareReferenceResearch} disabled={loading} className="primary-button">
            <Search size={17} /> 生成爆款参考包
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className={clsx("rounded border p-4", hasSearchPack ? "border-teal/30 bg-teal/5" : "border-ink/10 bg-white")}>
            <div className="text-xs font-medium text-ink/55">1. 搜索要求</div>
            <div className="mt-2 font-semibold">{hasSearchPack ? "已生成" : "待生成"}</div>
            <p className="mt-2 text-sm text-ink/60">复制研究要求给搜索工具，只读搜索参考账号。</p>
          </div>
          <div className={clsx("rounded border p-4", latest?.rawResults ? "border-teal/30 bg-teal/5" : "border-ink/10 bg-white")}>
            <div className="text-xs font-medium text-ink/55">2. 返回结果</div>
            <div className="mt-2 font-semibold">{latest?.rawResults ? "已粘贴" : "待粘贴"}</div>
            <p className="mt-2 text-sm text-ink/60">把搜索、主页和评论分析结果粘回右侧输入区。</p>
          </div>
          <div className={clsx("rounded border p-4", hasSummary ? "border-teal/30 bg-teal/5" : "border-ink/10 bg-white")}>
            <div className="text-xs font-medium text-ink/55">3. 增强策划</div>
            <div className="mt-2 font-semibold">{hasSummary ? "已增强" : "可选"}</div>
            <p className="mt-2 text-sm text-ink/60">大模型总结参考结果，用于增强策划、图片方案和正文草稿。</p>
          </div>
        </div>

        {latest?.searchKeywords && (
          <div className="mt-4 rounded border border-ink/10 bg-white px-3 py-2 text-sm text-ink/70">
            <span className="font-medium text-ink">搜索关键词：</span>
            {latest.searchKeywords}
          </div>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="panel">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="section-title">给 xiaohongshu_auto_op 的参考包</h2>
              <p className="mt-1 text-sm text-ink/60">通常只需要复制“命令包”和“研究要求”各一次。</p>
            </div>
            <div className="flex gap-2">
              <IconButton title="复制命令包" onClick={() => copy(commandBundle)} icon={<Clipboard size={17} />} />
              <IconButton title="复制研究要求" onClick={() => copy(researchPrompt)} icon={<FileText size={17} />} />
            </div>
          </div>

          {!hasSearchPack ? (
            <EmptyState text="可选步骤：点击“生成爆款参考包”后，这里会出现可复制的命令和研究要求。" />
          ) : (
            <div className="space-y-3">
              <div className="rounded border border-ink/10 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-medium">命令包</div>
                  <button type="button" onClick={() => copy(commandBundle)} className="secondary-button">
                    <Clipboard size={16} /> 复制
                  </button>
                </div>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded bg-ink p-3 text-xs leading-5 text-white">{commandBundle}</pre>
                <p className="mt-2 text-xs text-coral">只读探索命令，不发布、不关注、不私信、不互动。</p>
              </div>

              <details className="rounded border border-ink/10 bg-white p-3">
                <summary className="cursor-pointer text-sm font-medium">展开查看单条命令说明</summary>
                <div className="mt-3 space-y-3">
                  {commands.map((command: any) => (
                    <div key={`${command.category}-${command.command}`} className="rounded border border-ink/10 p-3">
                      <div className="font-medium">{command.category}</div>
                      <div className="mt-1 text-xs text-ink/60">{command.description}</div>
                      <code className="mt-2 block overflow-auto rounded bg-ink/90 px-3 py-2 text-xs text-white">{command.command}</code>
                    </div>
                  ))}
                </div>
              </details>

              <details className="rounded border border-ink/10 bg-white p-3">
                <summary className="cursor-pointer text-sm font-medium">展开查看研究要求</summary>
                <textarea className="code-textarea mt-3 min-h-[280px]" value={researchPrompt} readOnly />
              </details>
            </div>
          )}
        </div>

        <form className="panel" onSubmit={saveReferenceResearch}>
          <h2 className="section-title">粘贴参考结果，增强现有策划</h2>
          <p className="mt-1 text-sm text-ink/60">把 xiaohongshu_auto_op 返回的研究报告粘进来，大模型会提炼可借鉴的爆款风格，并更新当前策划。没有参考结果也可以继续主流程。</p>
          <div className="mt-4 grid gap-3">
            <label className="field">
              <span>重点参考账号</span>
              <textarea
                name="selectedAccounts"
                defaultValue={latest?.selectedAccounts || selected.referenceAccounts}
                rows={4}
                placeholder="账号名 / 主页 URL / 为什么值得参考。不确定可以留空。"
              />
            </label>
            <label className="field">
              <span>xiaohongshu_auto_op 返回结果</span>
              <textarea
                name="rawResults"
                defaultValue={latest?.rawResults || ""}
                rows={12}
                placeholder="粘贴 xhs-explore search、user-profile、评论分析等返回内容"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={loading} className="primary-button">
              <Sparkles size={17} /> 保存研究并增强策划
            </button>
            <span className="text-xs text-ink/55">成功后会更新策划案和账号配置文件；不需要也可以跳过。</span>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title">研究结论</h2>
            <p className="mt-1 text-sm text-ink/60">这里显示大模型总结后的可用结论，不再展示无关中间信息。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setActiveTab("strategy")} className="secondary-button">
              <Sparkles size={16} /> 策划案
            </button>
            <button type="button" onClick={() => setActiveTab("agents")} className="secondary-button">
              <FileText size={16} /> 配置文件
            </button>
            <IconButton title="复制总结" onClick={() => copy(summaryMarkdown)} icon={<Clipboard size={17} />} />
            <IconButton title="导出 Markdown" onClick={() => downloadText(`${selected.name}-reference-research.md`, summaryMarkdown)} icon={<Download size={17} />} />
          </div>
        </div>
        {hasSummary ? (
          <MarkdownBox value={summaryMarkdown} />
        ) : (
          <EmptyState text="还没有参考结论。这是可选增强，不影响你继续生成本周内容、图片方案和笔记草稿。" />
        )}
      </div>
    </div>
  );
}
function StrategyPanel({ selected, copy }: { selected?: Account; copy: (text: string) => void }) {
  if (!selected) return <EmptyState />;
  return (
    <div className="panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
            <h2 className="section-title">账号运营策划方案</h2>
          <p className="text-sm text-ink/60">{selected.strategy?.positioning}</p>
        </div>
        <div className="flex gap-2">
          <IconButton title="复制策划案" onClick={() => copy(selected.strategy?.markdown || "")} icon={<Clipboard size={17} />} />
          <IconButton title="导出 Markdown" onClick={() => downloadText(`${selected.name}-strategy.md`, selected.strategy?.markdown || "")} icon={<Download size={17} />} />
        </div>
      </div>
      <MarkdownBox value={selected.strategy?.markdown || "暂无策划案，请先创建账号。"} />
    </div>
  );
}

function AgentsPanel(props: {
  selected?: Account;
  profileContent: string;
  setProfileContent: (value: string) => void;
  saveProfile: () => void;
  copy: (text: string) => void;
}) {
  const { selected, profileContent, setProfileContent, saveProfile, copy } = props;
  if (!selected) return <EmptyState />;
  return (
    <div className="panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">配置文件编辑器</h2>
          <p className="text-sm text-ink/60">{selected.profilePath}</p>
        </div>
        <div className="flex gap-2">
          <IconButton title="保存版本" onClick={saveProfile} icon={<Save size={17} />} />
          <IconButton title="复制" onClick={() => copy(profileContent)} icon={<Clipboard size={17} />} />
          <IconButton title="导出 Markdown" onClick={() => downloadText(`${selected.name}-AGENTS.md`, profileContent)} icon={<Download size={17} />} />
        </div>
      </div>
      <textarea className="code-textarea min-h-[620px]" value={profileContent} onChange={(event) => setProfileContent(event.target.value)} />
    </div>
  );
}

function AssetsPanel(props: {
  selected?: Account;
  uploadAsset: (form: HTMLFormElement) => void;
  importAssetFolder: (form: HTMLFormElement) => void;
  generateManifest: () => void;
  manifest: { content: string; validation: string; path: string } | null;
  copy: (text: string) => void;
}) {
  const { selected, uploadAsset, importAssetFolder, generateManifest, manifest, copy } = props;
  if (!selected) return <EmptyState />;
  const copyText = assetUiCopy(selected.accountType);
  return (
    <div className="space-y-5">
      <div className="panel">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="section-title">素材库</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-ink/60">
              先把客户提供的真实图片上传进来。系统会记住每张图的文件名、来源和授权状态，后面生成图片方案时会优先使用这些真实素材。
            </p>
          </div>
          <div className="rounded bg-teal/10 px-3 py-2 text-sm font-medium text-teal">真实素材越清楚，改图越稳</div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded border border-ink/10 bg-white p-3">
            <div className="font-medium">素材怎么给？</div>
            <p className="mt-1 text-sm text-ink/60">少量或中等数量图片直接网页批量上传；特别大的素材包可以先同步到本机文件夹再登记路径。</p>
          </div>
          <div className="rounded border border-ink/10 bg-white p-3">
            <div className="font-medium">系统会怎么用？</div>
            <p className="mt-1 text-sm text-ink/60">系统会记录图片名字、来源、适合内容和风险备注，方便后续按菜品、环境、路线或产品自动匹配。</p>
          </div>
          <div className="rounded border border-ink/10 bg-white p-3">
            <div className="font-medium">图片不够怎么办？</div>
            <p className="mt-1 text-sm text-ink/60">先生成补拍清单；需要 AI 改图时，也只基于真实菜品、真实环境或真实现场图做延展。</p>
          </div>
        </div>
      </div>

      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault();
          uploadAsset(event.currentTarget);
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="section-title">上传图片 / 视频素材</h2>
            <p className="text-sm text-ink/60">可一次选择多张图片。建议提前把文件名改成菜品名、环境名、路线节点或产品名。</p>
          </div>
          <button type="submit" className="primary-button">
            <Upload size={17} /> 上传
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="field md:col-span-2">
            <span>图片 / 视频</span>
            <input name="files" type="file" accept="image/*,video/*" multiple required />
            <span className="text-xs text-ink/50">上传后会尽量保留原文件名，便于后面自动识别“清蒸鲈鱼”“包间”“停车场入口”等素材。</span>
          </label>
          <label className="field">
            <span>来源类型</span>
            <select name="sourceType" defaultValue={copyText.source}>
              {sourceTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>授权状态</span>
            <select name="authorizationState" defaultValue="待确认">
              {authStates.map((state) => (
                <option key={state}>{state}</option>
              ))}
            </select>
          </label>
          <Input name="location" label="拍摄地点" />
          <Input name="shotAt" label="拍摄时间" />
          <Input name="tags" label="标签" placeholder={copyText.singleTags} />
          <Input name="suitableTypes" label="适合什么内容" placeholder={copyText.singleSuitable} />
          <label className="flex items-center gap-2 rounded border border-ink/10 bg-white px-3 py-2 text-sm">
            <input name="coverReady" type="checkbox" value="true" /> 适合封面
          </label>
          <Input name="riskNotes" label="核验/风险备注" placeholder={copyText.singleRisk} />
        </div>
      </form>

      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault();
          importAssetFolder(event.currentTarget);
        }}
      >
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="section-title">已有大素材包</h2>
            <p className="mt-1 text-sm text-ink/60">
              图片特别多、已经在这台电脑或共享盘里整理好时，用这里登记文件夹路径；系统只登记路径，不复制文件。
            </p>
          </div>
          <button type="submit" className="secondary-button">
            <Library size={17} /> 登记文件夹
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            name="folderPath"
            label="这台电脑可访问的图片文件夹"
            placeholder={copyText.folderPlaceholder}
            help="如果图片在客户其他电脑，先用 U 盘、网盘同步或共享盘挂载到这台电脑，再填写这里。"
          />
          <label className="field">
            <span>来源类型</span>
            <select name="sourceType" defaultValue={copyText.source}>
              {sourceTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>授权状态</span>
            <select name="authorizationState" defaultValue="已授权">
              {authStates.map((state) => (
                <option key={state}>{state}</option>
              ))}
            </select>
          </label>
          <Input name="tags" label="统一标签" placeholder={copyText.tags} />
          <Input name="suitableTypes" label="适合什么内容" placeholder={copyText.suitable} />
          <Input name="riskNotes" label="统一核验备注" placeholder={copyText.risk} />
        </div>
      </form>

      <div className="panel">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="section-title">已登记素材</h2>
            <p className="mt-1 text-sm text-ink/60">生成素材清单后，系统会知道素材来源、授权状态、适合内容、封面可用性和风险备注。</p>
          </div>
          <button type="button" onClick={generateManifest} className="secondary-button">
            <FileText size={17} /> 生成素材清单
          </button>
        </div>
        {!selected.assets.length ? (
          <EmptyState text="还没有素材。建议先上传图片；如果是大批量客户素材，再登记已有文件夹。没有真实素材时，只能生成补拍清单和 AI 示意方案。" />
        ) : (
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
            {selected.assets.map((asset) => (
              <div key={asset.id} className="overflow-hidden rounded border border-ink/10 bg-white">
                <div className="flex aspect-video items-center justify-center bg-ink/5">
                  {asset.fileType.startsWith("image") && asset.filePath.startsWith("/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={asset.filePath} alt={asset.tags || "asset"} className="h-full w-full object-cover" />
                  ) : asset.fileType.startsWith("video") && asset.filePath.startsWith("/") ? (
                    <video src={asset.filePath} className="h-full w-full object-cover" controls />
                  ) : (
                    <div className="grid place-items-center gap-2 px-4 text-center text-xs text-ink/55">
                      <ImageIcon size={28} />
                      <span>本地路径素材，供龙虾读取</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-3 text-sm">
                  <div className="truncate font-medium">{asset.filePath}</div>
                  <div className="text-ink/60">{asset.sourceType} / {asset.authorizationState}</div>
                  <div>{asset.tags || "未标注标签"}</div>
                  <div className="flex gap-2 text-xs">
                    <span className={clsx("rounded px-2 py-1", asset.coverReady ? "bg-teal/10 text-teal" : "bg-ink/5")}>封面 {asset.coverReady ? "是" : "否"}</span>
                    <span className={clsx("rounded px-2 py-1", asset.used ? "bg-coral/10 text-coral" : "bg-ink/5")}>已用 {asset.used ? "是" : "否"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {manifest && (
          <div className="mt-5 rounded border border-ink/10 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium">{manifest.validation}</div>
              <IconButton title="复制 manifest" onClick={() => copy(manifest.content)} icon={<Clipboard size={16} />} />
            </div>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs">{manifest.content}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

function WeeklyPanel({
  selected,
  generateWeeklyPlan,
  loading
}: {
  selected?: Account;
  generateWeeklyPlan: (event: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
}) {
  const accountType = selected?.accountType || "restaurant";
  const presets = useMemo(() => weeklyPresets(accountType), [accountType]);
  const [selectedPresetNames, setSelectedPresetNames] = useState<string[]>([]);
  useEffect(() => {
    setSelectedPresetNames(presets[0]?.name ? [presets[0].name] : []);
  }, [presets]);

  if (!selected) return <EmptyState />;
  const selectedPresets = selectedPresetNames
    .map((name) => presets.find((preset) => preset.name === name))
    .filter((preset): preset is WeeklyPreset => Boolean(preset));
  const activePresets = selectedPresets.length ? selectedPresets : [presets[0]].filter(Boolean);
  const combinedPreset = combineWeeklyPresets(activePresets);
  const latestResearch = selected.referenceResearches?.[0];
  const hasStrategy = Boolean(selected.strategy?.markdown);
  const hasResearch = Boolean(latestResearch?.summaryMarkdown);
  const assetCount = selected.assets?.length ?? 0;
  const weeklyCopy = weeklyUiCopy(selected.accountType);
  const focusCopy = weeklyFocusCopy(selected.accountType);
  const defaultRatio = weeklyCopy.ratio;
  const togglePreset = (name: string) => {
    setSelectedPresetNames((current) => {
      if (current.includes(name)) {
        return current.length === 1 ? current : current.filter((item) => item !== name);
      }
      return [...current, name];
    });
  };

  return (
    <div className="space-y-5">
      <div className="panel">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="section-title">本周内容</h2>
            <p className="mt-1 max-w-3xl text-sm text-ink/60">
              先选本周要做什么，再补充特殊活动、主推菜品或重点素材。系统会生成本周每篇笔记的主题、图片需求和转化方向。
            </p>
          </div>
          <div className="rounded bg-teal/10 px-3 py-2 text-sm font-medium text-teal">安全模式：只生成计划</div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className={clsx("rounded border p-4", hasStrategy ? "border-teal/30 bg-teal/5" : "border-coral/30 bg-coral/5")}>
            <div className="text-xs font-medium text-ink/55">账号策划案</div>
            <div className="mt-2 font-semibold">{hasStrategy ? "已生成" : "缺少策划案"}</div>
            <p className="mt-2 text-sm text-ink/60">用于决定栏目、标题、转化路径和风险边界。</p>
          </div>
          <div className={clsx("rounded border p-4", hasResearch ? "border-teal/30 bg-teal/5" : "border-ink/10 bg-white")}>
            <div className="text-xs font-medium text-ink/55">竞品账号研究</div>
            <div className="mt-2 font-semibold">{hasResearch ? "已总结" : "可先补充"}</div>
            <p className="mt-2 text-sm text-ink/60">用于借鉴同类型账号的图片、标题结构和评论痛点，并避免同质化。</p>
          </div>
          <div className={clsx("rounded border p-4", assetCount ? "border-teal/30 bg-teal/5" : "border-ink/10 bg-white")}>
            <div className="text-xs font-medium text-ink/55">素材库</div>
            <div className="mt-2 font-semibold">{assetCount} 个素材</div>
            <p className="mt-2 text-sm text-ink/60">素材不足时会生成补拍/补资料清单，而不是伪造真实内容。</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <form
          className="panel"
          onSubmit={generateWeeklyPlan}
        >
          <div className="mb-4">
            <h2 className="section-title">本周目标设置</h2>
            <p className="mt-1 text-sm text-ink/60">不用懂运营术语。可以多选本周目标，再按需要改发布篇数。</p>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-3">
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => togglePreset(preset.name)}
                className={clsx(
                  "rounded border bg-white p-3 text-left transition hover:border-teal/40 hover:bg-teal/5",
                  selectedPresetNames.includes(preset.name) ? "border-teal/60 bg-teal/5 ring-2 ring-teal/15" : "border-ink/10"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{preset.name}</div>
                  <span className={clsx("rounded px-2 py-1 text-xs", selectedPresetNames.includes(preset.name) ? "bg-teal text-white" : "bg-ink/5 text-ink/45")}>
                    {selectedPresetNames.includes(preset.name) ? "已选" : "可选"}
                  </span>
                </div>
                <div className="mt-1 text-xs leading-5 text-ink/60">{preset.help}</div>
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded border border-ink/10 bg-white p-3 md:col-span-2">
              <div className="text-sm font-medium">已选运营目标</div>
              <div className="mt-2 text-sm leading-6 text-ink/65">{activePresets.map((preset) => preset.name).join(" / ")}</div>
              <div className="mt-1 text-xs leading-5 text-ink/50">{combinedPreset.goal}</div>
            </div>
            <Input name="frequency" label="本周发几篇" defaultValue={String(combinedPreset.frequency)} />
            <div className="rounded border border-ink/10 bg-white p-3 text-sm">
              <div className="font-medium">内容分配</div>
              <div className="mt-2 leading-6 text-ink/65">{combinedPreset.ratio || defaultRatio}</div>
            </div>
          </div>

          <div className="mt-4 rounded border border-ink/10 bg-white p-3">
            <Textarea name="weeklyFocus" label={focusCopy.label} placeholder={focusCopy.placeholder} help={focusCopy.help} />
            <input type="hidden" name="theme" value={combinedPreset.theme} readOnly />
            <input type="hidden" name="goal" value={combinedPreset.goal} readOnly />
            <input type="hidden" name="ratio" value={combinedPreset.ratio || defaultRatio} readOnly />
            <input type="hidden" name="testHypothesis" value={combinedPreset.testHypothesis} readOnly />
            <input type="hidden" name="commercializationMove" value={combinedPreset.commercializationMove} readOnly />
            <input type="hidden" name="interactionGoal" value={combinedPreset.interactionGoal} readOnly />
            <input type="hidden" name="availableAssets" value={combinedPreset.availableAssets} readOnly />
            <input type="hidden" name="taboos" defaultValue={selected.taboos} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={loading} className="primary-button">
              <Sparkles size={17} /> {loading ? "正在调用大模型..." : "生成一周计划"}
            </button>
            <span className="text-xs text-ink/55">生成后会自动跳转到“笔记草稿”页。</span>
          </div>
        </form>

        <PlanPreview plan={selected.weeklyPlans?.[0]} />
      </div>
    </div>
  );
}

function PlanPreview({ plan }: { plan?: WeeklyPlan }) {
  if (!plan) {
    return (
      <div className="panel">
        <h2 className="section-title">计划预览</h2>
        <div className="mt-4">
          <EmptyState text="还没有一周计划。设置本周目标后点击生成，任务会显示在这里。" />
        </div>
      </div>
    );
  }
  return (
    <div className="panel">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="section-title">{plan.theme}</h2>
          <p className="mt-1 text-sm text-ink/60">{plan.goal}</p>
        </div>
        <IconButton title="导出 Markdown" onClick={() => downloadText(`weekly-plan-${plan.id}.md`, weeklyPlanMarkdown(plan))} icon={<Download size={17} />} />
      </div>
      <div className="space-y-3">
        {plan.noteTasks.map((task) => (
          <div key={task.id} className="rounded border border-ink/10 bg-white p-3">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded bg-ink px-2 py-1 text-xs text-white">{task.publishAt}</span>
              <span className="rounded bg-teal/10 px-2 py-1 text-xs text-teal">{task.contentType}</span>
              <span className="rounded bg-coral/10 px-2 py-1 text-xs text-coral">{task.status}</span>
            </div>
            <div className="font-medium">{task.topicTitle}</div>
            <div className="mt-2 text-sm text-ink/65">{task.coreView}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function isWeddingUiAccount(account?: Account) {
  if (!account) return false;
  return /婚礼|婚庆|婚宴|婚纱|婚摄|婚照|备婚|新娘|新郎|新人|婚礼策划|婚礼布置|宴会设计|仪式区|甜品台|迎宾区/.test(
    [account.name, account.personaBase, account.contentDirections, account.materialCondition, account.businessGoals, account.targetUsers].join(" ")
  );
}

const weddingPlanningGoalPresets = [
  {
    label: "自动读图找选题",
    value: "客户提供约 30 张婚礼现场图。请先逐张识别画面里的蛋糕、花艺、仪式区、迎宾区、桌花、席位卡、灯光布幔、纸品等细节，再结合同行热门笔记风格，自动挑出最适合小红书的一周或两周选题。"
  },
  {
    label: "突出婚礼细节",
    value: "重点挖掘婚礼蛋糕、花艺、仪式区、迎宾区、桌花、席位卡、菜单卡、灯光布幔等细节的高级感和可收藏价值，每篇笔记只聚焦一个细节。"
  },
  {
    label: "提升备婚咨询",
    value: "选题要服务备婚用户的咨询转化。请优先输出容易引发评论的问题，例如预算、风格、场地适配、档期、花材、仪式区落地效果和如何与策划师沟通。"
  },
  {
    label: "参考爆款风格",
    value: "请重点研究小红书婚礼公司、婚礼策划、婚礼布置、备婚灵感类爆款笔记，学习标题节奏、封面文字、图集顺序、情绪表达和收藏理由，但不得照搬原文。"
  }
];

function ImagesPanel(props: {
  selected?: Account;
  plan?: WeeklyPlan;
  selectedNoteId: number | null;
  setSelectedNoteId: (id: number) => void;
  imageStyleDraft: {
    study?: ImageStyleStudy;
    commands?: Array<{ category: string; command: string; description: string; safetyNote: string }>;
    researchPrompt?: string;
    summary?: { summaryMarkdown: string; styleBrief: string[] };
  };
  prepareImageStyleStudy: () => void;
  saveImageStyleStudy: (event: React.FormEvent<HTMLFormElement>) => void;
  imagePromptResults: Record<number, ImagePromptResult>;
  generateImagePrompt: (task: NoteTask, options?: { openclawAssetsDir?: string; openclawImagePaths?: string }) => void;
  weddingImagePlanResult?: WeddingImagePlanResult | null;
  generateWeddingImagePlan: (options?: { weeks?: string; openclawAssetsDir?: string; openclawImagePaths?: string; planningGoal?: string }) => void;
  copy: (text: string) => void;
  loading: boolean;
}) {
  const {
    selected,
    plan,
    selectedNoteId,
    setSelectedNoteId,
    imageStyleDraft,
    prepareImageStyleStudy,
    saveImageStyleStudy,
    imagePromptResults,
    generateImagePrompt,
    weddingImagePlanResult,
    generateWeddingImagePlan,
    copy,
    loading
  } = props;
  const note = plan?.noteTasks.find((task) => task.id === selectedNoteId) ?? plan?.noteTasks?.[0];
  const result = note ? imagePromptResults[note.id] : null;
  const latestStudy = imageStyleDraft.study || selected?.imageStyleStudies?.[0];
  const latestStyleSummary = imageStyleDraft.summary?.summaryMarkdown || latestStudy?.summaryMarkdown || result?.referenceStyle || "";
  const styleCommands = imageStyleDraft.commands || (latestStudy?.commandJson ? safeParseCommands(latestStudy.commandJson) : []);
  const stylePrompt = imageStyleDraft.researchPrompt || latestStudy?.researchPrompt || "";
  const copyText = assetUiCopy(selected?.accountType);
  const isWedding = isWeddingUiAccount(selected);
  const commandList = [...(weddingImagePlanResult?.commands || []), ...(result?.commands || [])];
  const [weddingPlanningGoal, setWeddingPlanningGoal] = useState(weddingPlanningGoalPresets[0].value);

  return (
    <div className="grid gap-5 xl:grid-cols-[0.42fr_0.58fr]">
      <div className="space-y-5">
        {!isWedding && (
        <details className="panel">
          <summary className="cursor-pointer text-sm font-medium">
            参考图片风格（可选，高级）
            <span className="ml-2 text-xs font-normal text-ink/50">需要研究同类账号图片时再展开</span>
          </summary>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="section-title">参考图片风格</h2>
              <p className="mt-1 text-sm text-ink/60">
                只读搜索同类型账号的封面和图集，总结可复用的封面结构、图集顺序和信息卡原则。后面的单篇图片方案会自动引用这些原则。
              </p>
            </div>
            <button type="button" onClick={prepareImageStyleStudy} disabled={loading || !selected} className="secondary-button shrink-0">
              <Search size={16} /> 生成参考研究
            </button>
          </div>

          <div className="space-y-3">
            {styleCommands.map((command) => (
              <div key={`${command.category}-${command.command}`} className="rounded border border-ink/10 bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{command.category}</div>
                    <div className="text-xs text-ink/60">{command.description}</div>
                  </div>
                  <IconButton title="复制命令" onClick={() => copy(command.command)} icon={<Clipboard size={16} />} />
                </div>
                <code className="block overflow-auto rounded bg-ink px-3 py-2 text-xs text-white">{command.command}</code>
                <div className="mt-2 text-xs text-coral">{command.safetyNote}</div>
              </div>
            ))}
            {stylePrompt ? (
              <details className="rounded border border-ink/10 bg-white p-3">
                <summary className="cursor-pointer text-sm font-medium">查看详细研究要求</summary>
                <div className="mt-3 flex justify-end">
                  <IconButton title="复制研究要求" onClick={() => copy(stylePrompt)} icon={<Clipboard size={16} />} />
                </div>
                <textarea className="code-textarea mt-2 min-h-[260px]" value={stylePrompt} readOnly />
              </details>
            ) : (
              <EmptyState text="需要参考同类账号图片时，点击“生成参考研究”，运行后把结果粘贴到下方。" />
            )}
          </div>

          <form onSubmit={saveImageStyleStudy} className="mt-4">
            <Textarea
              name="rawResults"
              label="粘贴参考图片研究结果"
              defaultValue={latestStudy?.rawResults || ""}
              placeholder={copyText.stylePlaceholder}
            />
            <button type="submit" disabled={loading || !selected} className="primary-button mt-3">
              <Sparkles size={17} /> 保存并总结图片风格
            </button>
          </form>
        </details>
        )}

        {isWedding && (
          <form
            className="panel border-teal/30"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              generateWeddingImagePlan({
                weeks: String(form.get("weeks") || "1"),
                openclawAssetsDir: String(form.get("openclawAssetsDir") || ""),
                openclawImagePaths: String(form.get("openclawImagePaths") || ""),
                planningGoal: String(form.get("planningGoal") || "")
              });
            }}
          >
            <div className="mb-4">
              <div className="mb-2 inline-flex rounded bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">婚礼账号优先流程</div>
              <h2 className="section-title">用婚礼现场图自动生成选题规划</h2>
              <p className="mt-1 text-sm text-ink/60">
                运营者只需要准备图片文件夹，系统会生成给龙虾的 Prompt：先读图找细节，再研究同行爆款风格，最后输出一周或两周笔记规划。
              </p>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-3">
              {[
                ["1", "放入婚礼图片", "建议 20-40 张，文件名尽量写清细节。"],
                ["2", "生成龙虾 Prompt", "让龙虾读图并研究小红书爆款。"],
                ["3", "得到周计划", "输出标题、配图顺序、正文方向和风险核验。"]
              ].map(([step, title, desc]) => (
                <div key={step} className="rounded border border-teal/15 bg-teal/5 p-3">
                  <div className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded bg-teal text-xs font-semibold text-white">{step}</div>
                  <div className="text-sm font-semibold">{title}</div>
                  <div className="mt-1 text-xs leading-5 text-ink/60">{desc}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-[160px_1fr]">
              <label className="field">
                <span>规划周期</span>
                <select name="weeks" defaultValue="1">
                  <option value="1">一周规划</option>
                  <option value="2">两周规划</option>
                </select>
              </label>
              <Input
                name="openclawAssetsDir"
                label={`婚礼图片文件夹${selected?.assets?.length ? `（已登记 ${selected.assets.length} 张素材）` : ""}`}
                defaultValue={selected?.assetsPath || ""}
                placeholder="/Users/.../婚礼现场图"
                help="可以填客户图片所在文件夹；不填则默认使用当前账号素材库。"
              />
            </div>

            <div className="mt-3 grid gap-3">
              <div>
                <div className="mb-2 text-sm font-medium text-ink/70">本次希望龙虾重点完成什么？</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {weddingPlanningGoalPresets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setWeddingPlanningGoal(preset.value)}
                      className={clsx(
                        "rounded border px-3 py-2 text-left text-sm transition",
                        weddingPlanningGoal === preset.value ? "border-teal bg-teal/10 text-teal" : "border-ink/10 bg-white text-ink/70 hover:border-teal/40"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                name="planningGoal"
                label="本次额外诉求"
                value={weddingPlanningGoal}
                onChange={setWeddingPlanningGoal}
                placeholder="例如：重点挖掘婚礼蛋糕、法式花艺和仪式区细节；希望提升备婚咨询。"
                help="可以直接用上面的预设，也可以改成客户自己的诉求。"
              />
              <Textarea
                name="openclawImagePaths"
                label="只指定部分图片（可选）"
                placeholder={"婚礼蛋糕.jpg\n香槟色花艺.jpg\n仪式区拱门.jpg\n迎宾牌.jpg"}
                help="通常不用填，龙虾会读取整个文件夹。只有想优先分析某几张图时再填写。"
              />
            </div>

            <button type="submit" disabled={loading || !selected} className="primary-button mt-4">
              <Sparkles size={17} /> 生成给龙虾的一键规划 Prompt
            </button>

            {weddingImagePlanResult?.planningPrompt.path && (
              <div className="mt-3 rounded bg-teal/10 px-3 py-2 text-xs text-teal">{weddingImagePlanResult.planningPrompt.path}</div>
            )}
          </form>
        )}

        <form
          className="panel"
          onSubmit={(event) => {
            event.preventDefault();
            if (!note) return;
            const form = new FormData(event.currentTarget);
            generateImagePrompt(note, {
              openclawAssetsDir: String(form.get("openclawAssetsDir") || ""),
              openclawImagePaths: String(form.get("openclawImagePaths") || "")
            });
          }}
        >
          <div className="mb-4">
            <h2 className="section-title">{isWedding ? "规划后再细化单篇图片方案（可选）" : "生成本篇图片方案"}</h2>
            <p className="mt-1 text-sm text-ink/60">
              {isWedding
                ? "批量规划完成后，如果你已经把某篇选题放进“本周内容”，可以在这里继续生成这篇笔记的逐张图片方案。"
                : "选择一篇本周内容，系统会根据已上传素材生成每张图怎么选、怎么改、怎么排；素材不足时会先列补拍和补资料清单。"}
            </p>
          </div>

          {plan && note ? (
            <label className="field">
              <span>选择本周内容</span>
              <select value={note.id} onChange={(event) => setSelectedNoteId(Number(event.target.value))}>
                {plan.noteTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.topicTitle}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <EmptyState text={isWedding ? "婚礼账号可以先用上方“批量图片选题规划”生成一周或两周方案；有了具体选题后，再回来细化单篇图片方案。" : "先到“本周内容”生成计划，再为某篇笔记生成图片方案。"} />
          )}

          {note && (
            <div className="mt-4 rounded border border-ink/10 bg-white p-3">
              <div className="text-sm font-medium">当前图片目标</div>
              <div className="mt-2 text-sm leading-6 text-ink/65">
                <div>封面方向：{note.coverCopyDirection || "未设置"}</div>
                <div>所需图片：{note.requiredImages || "按选题生成图卡结构"}</div>
                <div>推荐素材：{note.recommendedAssets || "暂无，生成素材缺口"}</div>
              </div>
            </div>
          )}

          <details className="mt-4 rounded border border-ink/10 bg-white p-3">
            <summary className="cursor-pointer text-sm font-medium">指定要使用的素材（可选）</summary>
            <div className="mt-3 grid gap-3">
              <Input name="openclawAssetsDir" label="素材文件夹" defaultValue={selected?.assetsPath || ""} placeholder={copyText.assetsDirPlaceholder} />
              <Textarea
                name="openclawImagePaths"
                label="指定图片文件名或路径"
                placeholder={copyText.imagePathsPlaceholder}
                help="默认读取当前账号素材目录；如果客户图片在另一个本机文件夹，填那个文件夹路径。"
              />
            </div>
          </details>

          <button type="submit" disabled={loading || !note} className="primary-button mt-4">
            <ImageIcon size={17} /> {isWedding ? "细化这篇图片方案" : "生成图片方案"}
          </button>
        </form>

        <div className="panel">
          <h2 className="section-title">给龙虾的执行命令</h2>
          <div className="mt-3 space-y-3">
            {commandList.map((command) => (
              <div key={`${command.category}-${command.command}`} className="rounded border border-ink/10 bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{command.category}</div>
                    <div className="text-xs text-ink/60">{command.description}</div>
                  </div>
                  <IconButton title="复制命令" onClick={() => copy(command.command)} icon={<Clipboard size={16} />} />
                </div>
                <code className="block overflow-auto rounded bg-ink px-3 py-2 text-xs text-white">{command.command}</code>
                <div className="mt-2 text-xs text-coral">{command.safetyNote}</div>
              </div>
            ))}
            {!commandList.length && <EmptyState text={isWedding ? "先生成批量规划 Prompt，或生成单篇图片方案后，这里会显示可以复制给龙虾的执行命令。" : "生成图片方案后，这里会显示可以复制给龙虾的执行命令。"} />}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {isWedding && (
          <div className="panel border-teal/30">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="section-title">婚礼批量规划 Prompt</h2>
                <p className="mt-1 text-sm text-ink/60">用于让龙虾先读 30 张婚礼图、研究同行热门笔记，再输出一周或两周内容规划。</p>
              </div>
              <div className="flex gap-2">
                <IconButton title="复制批量规划 Prompt" onClick={() => copy(weddingImagePlanResult?.planningPrompt.content || "")} icon={<Clipboard size={17} />} />
                <IconButton
                  title="导出 Markdown"
                  onClick={() => downloadText(`wedding-image-plan-${selected?.name || "draft"}.md`, weddingImagePlanResult?.planningPrompt.content || "")}
                  icon={<Download size={17} />}
                />
              </div>
            </div>
            {weddingImagePlanResult?.planningPrompt.path && <div className="mb-2 rounded bg-teal/10 px-3 py-2 text-xs text-teal">{weddingImagePlanResult.planningPrompt.path}</div>}
            {weddingImagePlanResult ? (
              <div className="mb-3 grid gap-2 sm:grid-cols-3">
                {[
                  ["复制 Prompt", "给龙虾读取图片和研究爆款。"],
                  ["执行命令", "用左侧命令生成规划草稿。"],
                  ["人工核验", "检查肖像授权、价格、档期和场地。"]
                ].map(([title, desc]) => (
                  <div key={title} className="rounded border border-teal/15 bg-teal/5 p-3">
                    <div className="text-sm font-semibold text-teal">{title}</div>
                    <div className="mt-1 text-xs leading-5 text-ink/60">{desc}</div>
                  </div>
                ))}
              </div>
            ) : null}
            <textarea
              className="code-textarea min-h-[360px]"
              value={
                weddingImagePlanResult?.planningPrompt.content ||
                "点击左侧“生成批量规划 Prompt”后，这里会显示完整任务说明：批量读图、同行爆款研究、一周/两周笔记规划、后续单篇 Prompt 和风险边界。"
              }
              readOnly
            />
          </div>
        )}

        <div className="panel">
          <h2 className="section-title">图片风格摘要</h2>
          <p className="mt-1 text-sm text-ink/60">
            可选参考：总结同类型账号的封面、图集、信息卡、真实感和收藏点。
          </p>
          <div className="mt-3">
            {latestStyleSummary ? (
              <MarkdownBox value={latestStyleSummary} />
            ) : (
              <EmptyState text="还没有参考图片研究。普通出图可以先跳过这里。" />
            )}
          </div>
        </div>

        <div className="panel">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="section-title">图片方案</h2>
              <p className="mt-1 text-sm text-ink/60">包含每张图的用途、素材来源、改图要求、文字叠加建议和素材缺口。</p>
            </div>
            <div className="flex gap-2">
              <IconButton title="复制图片方案" onClick={() => copy(result?.imagePrompt.content || "")} icon={<Clipboard size={17} />} />
              <IconButton title="导出 Markdown" onClick={() => downloadText(`note-${note?.id || "draft"}-image-prompt.md`, result?.imagePrompt.content || "")} icon={<Download size={17} />} />
            </div>
          </div>
          {result?.imagePrompt.path && <div className="mb-2 rounded bg-teal/10 px-3 py-2 text-xs text-teal">{result.imagePrompt.path}</div>}
          <textarea className="code-textarea min-h-[620px]" value={result?.imagePrompt.content || (note ? "点击生成后显示逐张图片方案。" : "先生成本周内容，再生成单篇图片方案。")} readOnly />
        </div>
      </div>
    </div>
  );
}

function PromptsPanel(props: {
  plan?: WeeklyPlan;
  selectedNoteId: number | null;
  setSelectedNoteId: (id: number) => void;
  promptResults: Record<number, PromptResult>;
  generatePrompt: (task: NoteTask) => void;
  copy: (text: string) => void;
}) {
  const { plan, selectedNoteId, setSelectedNoteId, promptResults, generatePrompt, copy } = props;
  const note = plan?.noteTasks.find((task) => task.id === selectedNoteId) ?? plan?.noteTasks?.[0];
  const result = note ? promptResults[note.id] : null;
  if (!plan || !note) return <div className="panel"><EmptyState text="先生成本周内容，再生成笔记草稿。" /></div>;
  return (
    <div className="grid gap-5 xl:grid-cols-[0.45fr_0.55fr]">
      <div className="panel">
        <h2 className="section-title">选择本周内容</h2>
        <div className="space-y-2">
          {plan.noteTasks.map((task) => (
            <button key={task.id} type="button" onClick={() => setSelectedNoteId(task.id)} className={clsx("w-full rounded border p-3 text-left text-sm", task.id === note.id ? "border-ink bg-white" : "border-ink/10 bg-white/60")}>
              <div className="font-medium">{task.topicTitle}</div>
              <div className="mt-1 text-xs text-ink/60">{task.publishAt} / {task.status}</div>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => generatePrompt(note)} className="primary-button mt-4">
          <Wand2 size={17} /> 生成正文草稿
        </button>
      </div>
      <div className="space-y-5">
        <div className="panel">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="section-title">正文草稿</h2>
              <p className="mt-1 text-sm text-ink/60">发布精简版：短正文、少字段，符合小红书阅读习惯；价格、距离、活动规则等需要人工核验。</p>
            </div>
            <div className="flex gap-2">
              <IconButton title="复制草稿要求" onClick={() => copy(result?.prompt.content || "")} icon={<Clipboard size={17} />} />
              <IconButton title="导出 Markdown" onClick={() => downloadText(`note-${note.id}-prompt.md`, result?.prompt.content || "")} icon={<Download size={17} />} />
            </div>
          </div>
          <textarea className="code-textarea min-h-[420px]" value={result?.prompt.content || "点击生成按钮后显示可复制的正文草稿要求。"} readOnly />
        </div>

        <div className="panel">
          <h2 className="section-title">给龙虾的执行命令</h2>
          <div className="space-y-3">
            {(result?.commands || []).map((command) => (
              <div key={`${command.category}-${command.command}`} className="rounded border border-ink/10 bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{command.category}</div>
                    <div className="text-xs text-ink/60">{command.description}</div>
                  </div>
                  <IconButton title="复制命令" onClick={() => copy(command.command)} icon={<Clipboard size={16} />} />
                </div>
                <code className="block overflow-auto rounded bg-ink px-3 py-2 text-xs text-white">{command.command}</code>
                <div className="mt-2 text-xs text-coral">{command.safetyNote}</div>
              </div>
            ))}
            {!result?.commands?.length && <div className="text-sm text-ink/60">生成正文草稿后，这里会出现可复制的执行命令。</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function InteractionsPanel(props: {
  selected?: Account;
  latestPlan?: WeeklyPlan;
  selectedNoteId: number | null;
  setSelectedNoteId: (id: number) => void;
  draft: {
    plan?: InteractionPlan;
    commands?: Array<{ category: string; command: string; description: string; safetyNote: string }>;
    discoveryPrompt?: string;
    commentPrompt?: string;
    summary?: { targetUsersMarkdown: string; commentDraftsMarkdown: string };
  };
  prepareInteractionPlan: (noteTaskId?: number | null, options?: { publishedNoteUrl?: string; interactionGoal?: string }) => void;
  saveInteractionResults: (event: React.FormEvent<HTMLFormElement>) => void;
  copy: (text: string) => void;
  loading: boolean;
}) {
  const {
    selected,
    latestPlan,
    selectedNoteId,
    setSelectedNoteId,
    draft,
    prepareInteractionPlan,
    copy,
    loading
  } = props;
  if (!selected) return <EmptyState />;

  const note = latestPlan?.noteTasks.find((task) => task.id === selectedNoteId) ?? latestPlan?.noteTasks?.[0];
  const latest = draft.plan || selected.interactionPlans?.[0];
  const commands = draft.commands || (latest?.commandJson ? safeJsonArray(latest.commandJson) : []);
  const taskPrompt = draft.discoveryPrompt || latest?.discoveryPrompt || "";
  const commandBundle = commands.map((command: any) => command.command).join("\n");
  const defaultGoal = note
    ? `围绕这篇已发布笔记，寻找可能对「${note.topicTitle}」感兴趣的用户，进行自然、有帮助、不打扰的评论互动。`
    : "围绕这篇已发布笔记，寻找可能对账号内容感兴趣的用户，进行自然、有帮助、不打扰的评论互动。";

  return (
    <div className="space-y-5">
      <div className="panel">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="section-title">目标用户互动</h2>
            <p className="mt-1 max-w-3xl text-sm text-ink/60">
              这里只做轻量调度：告诉 xiaohongshu_auto_op 基于哪篇已发布笔记去互动。搜索谁、怎么判断兴趣、怎么评论，由 skill 自主完成。
            </p>
          </div>
          <div className="rounded bg-coral/10 px-3 py-2 text-sm font-medium text-coral">本地只生成互动建议，不自动操作账号</div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded border border-teal/30 bg-teal/5 p-4">
            <div className="text-xs font-medium text-ink/55">1. 选择笔记</div>
            <div className="mt-2 font-semibold">{note ? "已选择" : "待选择"}</div>
            <p className="mt-2 text-sm text-ink/60">用一周计划里的笔记作为互动上下文。</p>
          </div>
          <div className={clsx("rounded border p-4", latest?.searchKeywords ? "border-teal/30 bg-teal/5" : "border-ink/10 bg-white")}>
            <div className="text-xs font-medium text-ink/55">2. 已发布链接</div>
            <div className="mt-2 font-semibold">{latest?.searchKeywords ? "已记录" : "待填写"}</div>
            <p className="mt-2 text-sm text-ink/60">粘贴小红书已发布笔记 URL。</p>
          </div>
          <div className={clsx("rounded border p-4", taskPrompt ? "border-teal/30 bg-teal/5" : "border-ink/10 bg-white")}>
            <div className="text-xs font-medium text-ink/55">3. 互动指令</div>
            <div className="mt-2 font-semibold">{taskPrompt ? "已生成" : "待生成"}</div>
            <p className="mt-2 text-sm text-ink/60">复制给 skill 或按命令建议人工执行。</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.42fr_0.58fr]">
        <div className="space-y-5">
          <form
            className="panel"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              prepareInteractionPlan(note?.id ?? null, {
                publishedNoteUrl: String(form.get("publishedNoteUrl") || ""),
                interactionGoal: String(form.get("interactionGoal") || "")
              });
            }}
          >
            <h2 className="section-title">生成互动任务</h2>
            <p className="mt-1 text-sm text-ink/60">选择本周内容，粘贴对应的已发布小红书笔记链接。</p>

            <div className="mt-4 space-y-3">
              {!latestPlan?.noteTasks?.length ? (
                <EmptyState text="建议先生成一周计划。也可以只填写已发布链接和互动目标。" />
              ) : (
                <label className="field">
                  <span>关联笔记任务</span>
                  <select value={note?.id ?? ""} onChange={(event) => setSelectedNoteId(Number(event.target.value))}>
                    {latestPlan.noteTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.topicTitle}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <Input name="publishedNoteUrl" label="已发布笔记 URL" defaultValue={latest?.searchKeywords || ""} placeholder="粘贴小红书已发布笔记链接" />
              <Textarea name="interactionGoal" label="互动目标" defaultValue={defaultGoal} />

              <button type="submit" disabled={loading} className="primary-button">
                <MessageCircle size={17} /> 生成互动建议
              </button>
              <p className="text-xs text-ink/55">真实账号互动只生成命令建议；是否执行由你在终端确认。</p>
            </div>
          </form>

          <div className="panel">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="section-title">命令建议</h2>
                <p className="mt-1 text-sm text-ink/60">保留给 skill 的自主空间，不在网站里拆解互动细节。</p>
              </div>
              <IconButton title="复制命令包" onClick={() => copy(commandBundle)} icon={<Clipboard size={17} />} />
            </div>
            {!commands.length ? (
              <EmptyState text="生成互动任务后显示命令建议。" />
            ) : (
              <div className="space-y-3">
                {commands.map((command: any) => (
                  <div key={`${command.category}-${command.command}`} className="rounded border border-ink/10 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{command.category}</div>
                        <div className="text-xs text-ink/60">{command.description}</div>
                      </div>
                      <IconButton title="复制命令" onClick={() => copy(command.command)} icon={<Clipboard size={16} />} />
                    </div>
                    <code className="block overflow-auto rounded bg-ink px-3 py-2 text-xs text-white">{command.command}</code>
                    <div className="mt-2 text-xs text-coral">{command.safetyNote}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="panel">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="section-title">互动任务</h2>
                <p className="mt-1 text-sm text-ink/60">复制给 xiaohongshu_auto_op，让它基于已发布笔记自主完成找人和互动判断。</p>
              </div>
              <div className="flex gap-2">
                <IconButton title="复制互动任务" onClick={() => copy(taskPrompt)} icon={<Clipboard size={17} />} />
                <IconButton title="导出 Markdown" onClick={() => downloadText(`${selected.name}-interaction-task.md`, taskPrompt)} icon={<Download size={17} />} />
              </div>
            </div>
            <textarea className="code-textarea min-h-[560px]" value={taskPrompt || "填写已发布笔记 URL 后生成互动任务。"} readOnly />
          </div>
        </div>
      </div>
    </div>
  );
}

function DraftPanel({ note, saveDraft }: { note?: NoteTask; saveDraft: (event: React.FormEvent<HTMLFormElement>) => void }) {
  if (!note) return <div className="panel"><EmptyState text="先选择或生成一篇本周内容。" /></div>;
  return (
    <form className="panel" onSubmit={saveDraft}>
      <h2 className="section-title">保存 skill 返回的草稿结果</h2>
      <p className="mb-4 text-sm text-ink/60">{note.topicTitle}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <Textarea name="titleCandidates" label="标题候选" />
        <Input name="finalTitle" label="最终标题" />
        <Textarea name="coverCopyCandidates" label="封面文案候选" />
        <Input name="finalCoverCopy" label="最终封面文案" />
        <Textarea name="body" label="正文" />
        <Textarea name="imageOrderAdvice" label="图片排序建议" />
        <Textarea name="imageCaptions" label="每张图配文" />
        <Input name="tags" label="标签" />
        <Textarea name="commentGuide" label="评论区引导" />
        <Textarea name="publishAdvice" label="发布建议" />
        <Input name="publishStatus" label="发布状态" defaultValue="未发布" />
        <Textarea name="rawResult" label="原始返回内容" />
      </div>
      <button type="submit" className="primary-button mt-4">
        <Save size={17} /> 保存草稿结果
      </button>
    </form>
  );
}

function ReportsPanel({ generateReport, latestPlan }: { generateReport: (event: React.FormEvent<HTMLFormElement>) => void; latestPlan?: WeeklyPlan }) {
  return (
    <form className="panel" onSubmit={generateReport}>
      <h2 className="section-title">周报复盘</h2>
      <div className="grid gap-3">
        <Input name="weekLabel" label="周期" defaultValue={latestPlan?.weekStart || "本周"} />
        <Textarea
          name="rows"
          label="发布笔记数据"
          defaultValue="标题, 曝光, 点击, 点赞, 收藏, 评论, 私信, 转化"
        />
        <Textarea name="subjective" label="主观观察" placeholder="例如：封面更清晰的笔记评论更多，教程类收藏较高。" />
      </div>
      <button type="submit" className="primary-button mt-4">
        <Send size={17} /> 生成并导出复盘建议
      </button>
    </form>
  );
}

function HealthPanel({ health, loadHealth }: { health: any; loadHealth: () => void }) {
  return (
    <div className="panel">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="section-title">系统状态</h2>
        <button type="button" onClick={loadHealth} className="secondary-button">
          <Activity size={17} /> 刷新诊断
        </button>
      </div>
      {!health ? (
        <EmptyState text="点击刷新诊断查看环境状态。" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Info label="当前模式" value={health.mode} />
          <Info label="OpenAI API" value={`${health.llm.enabled ? "已配置" : "未配置"} / ${health.llm.model}`} />
          <Info label="xiaohongshu_auto_op 路径" value={health.xhsAutoOpPath} />
          <Info label="profiles 目录" value={`${health.profiles.exists ? "可用" : "缺失"} / ${health.profiles.path}`} />
          <Info label="assets 目录" value={`${health.assets.exists ? "可用" : "缺失"} / ${health.assets.path}`} />
          <Info label="uv" value={`${health.uv.available ? "可用" : "不可用"} / ${health.uv.version}`} />
          <Info label="数据统计" value={`账号 ${health.counts.accounts} / 素材 ${health.counts.assets}`} />
          <div className="md:col-span-2">
            <div className="mb-2 text-sm font-medium">MEMORY.md 摘要</div>
            <pre className="max-h-72 overflow-auto rounded border border-ink/10 bg-white p-3 text-xs">{health.memorySummary}</pre>
          </div>
          <div className="md:col-span-2">
            <div className="mb-2 text-sm font-medium">环境诊断报告</div>
            <div className="space-y-2">
              {health.diagnostics.map((item: string) => (
                <div key={item} className="rounded border border-ink/10 bg-white px-3 py-2 text-sm">{item}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input(props: {
  label: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  name?: string;
  help?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <input name={props.name} value={props.value} defaultValue={props.defaultValue} placeholder={props.placeholder} onChange={(event) => props.onChange?.(event.target.value)} />
      {props.help && <span className="text-xs leading-5 text-ink/50">{props.help}</span>}
    </label>
  );
}

function Textarea(props: {
  label: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  name?: string;
  help?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{props.label}</span>
      <textarea name={props.name} value={props.value} defaultValue={props.defaultValue} placeholder={props.placeholder} rows={4} onChange={(event) => props.onChange?.(event.target.value)} />
      {props.help && <span className="text-xs leading-5 text-ink/50">{props.help}</span>}
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-ink/10 bg-white p-3">
      <div className="text-xs text-ink/55">{label}</div>
      <div className="mt-1 break-words text-sm">{value}</div>
    </div>
  );
}

function IconButton({ title, onClick, icon }: { title: string; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button type="button" title={title} onClick={onClick} className="icon-button">
      {icon}
    </button>
  );
}

function MarkdownBox({ value }: { value: string }) {
  return <pre className="max-h-[72vh] overflow-auto whitespace-pre-wrap rounded border border-ink/10 bg-white p-4 text-sm leading-6">{value}</pre>;
}

function EmptyState({ text = "还没有数据，请先创建账号。" }: { text?: string }) {
  return <div className="rounded border border-dashed border-ink/20 bg-white/60 p-8 text-center text-sm text-ink/60">{text}</div>;
}

function splitChoiceText(value: string) {
  return value
    .split(/[，,、；;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function MultiChoiceField(props: {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  help?: string;
  onChange: (value: string) => void;
}) {
  const tokens = splitChoiceText(props.value);
  const selected = props.options.filter((option) => tokens.includes(option));
  const extra = tokens.filter((item) => !props.options.includes(item)).join("、");
  const write = (nextSelected: string[], nextExtra: string) => {
    props.onChange([...nextSelected, ...splitChoiceText(nextExtra)].join("、"));
  };

  return (
    <div className="field">
      <span>{props.label}</span>
      <div className="flex flex-wrap gap-2 rounded border border-ink/10 bg-white p-2">
        {props.options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                const next = active ? selected.filter((item) => item !== option) : [...selected, option];
                write(next, extra);
              }}
              className={clsx(
                "rounded border px-3 py-2 text-sm transition",
                active ? "border-teal/60 bg-teal/10 text-teal" : "border-ink/10 bg-white hover:border-teal/40 hover:bg-teal/5"
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      <input
        value={extra}
        placeholder={props.placeholder || "其他补充"}
        onChange={(event) => write(selected, event.target.value)}
        className="mt-2"
      />
      {props.help && <span className="text-xs leading-5 text-ink/50">{props.help}</span>}
    </div>
  );
}

function safeJsonArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeParseCommands(value: string) {
  return safeJsonArray(value).filter(
    (item): item is { category: string; command: string; description: string; safetyNote: string } =>
      item &&
      typeof item === "object" &&
      typeof item.category === "string" &&
      typeof item.command === "string" &&
      typeof item.description === "string" &&
      typeof item.safetyNote === "string"
  );
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function weeklyPlanMarkdown(plan: WeeklyPlan) {
  return `# ${plan.theme}

## 本周目标
${plan.goal}

## note_tasks
${plan.noteTasks
  .map(
    (task, index) => `### ${index + 1}. ${task.topicTitle}
- 发布时间：${task.publishAt}
- 内容类型：${task.contentType}
- 内容目标：${task.contentGoal}
- 目标用户：${task.targetUser}
- 用户痛点：${task.painPoint}
- 核心观点：${task.coreView}
- 正文结构：${task.bodyStructure}
- 推荐素材：${task.recommendedAssets}
- 封面文案方向：${task.coverCopyDirection}
- 评论区钩子：${task.commentHook}
- 预期目标：${task.expectedGoal}`
  )
  .join("\n\n")}`;
}

function weeklyPresets(accountType: string) {
  const mode = accountUiMode(accountType);
  const presets = {
    culture_tourism: [
      {
        name: "目的地动线",
        help: "适合文旅项目冷启动：先让用户知道这里怎么逛、值不值得去。",
        theme: "文旅目的地动线攻略周",
        goal: "提升收藏和出行咨询，收集用户最关心的交通票务问题",
        frequency: 4,
        ratio: "目的地种草2 / 动线攻略1 / 交通票务1",
        testHypothesis: "真实目的地图 + 动线信息，比单纯风景图更容易被收藏。",
        commercializationMove: "轻量提到票务、活动报名、线路产品或官方咨询入口。",
        interactionGoal: "每篇引导用户留言出行日期、同行人、交通方式和最想看的体验。",
        availableAssets: "目的地图、活动现场图、导览图、票务/交通截图；缺图就生成补拍/补资料清单。"
      },
      {
        name: "节庆活动",
        help: "适合有民俗节庆、演出、市集或季节活动的目的地。",
        theme: "节庆活动和周末玩法周",
        goal: "让用户明确活动时间、看点、动线和是否适合自己",
        frequency: 4,
        ratio: "活动种草2 / 拍照机位1 / 服务信息1",
        testHypothesis: "活动现场图搭配日期和交通，会提升评论咨询。",
        commercializationMove: "自然提到预约、票务、停车或活动报名，以人工确认信息为准。",
        interactionGoal: "引导用户留言想来的日期、是否亲子、是否需要避开人流。",
        availableAssets: "活动现场、节目单、导览图、交通停车、服务设施照片。"
      },
      {
        name: "出行问题",
        help: "适合积累用户需求：评论区会告诉你真正影响出行的障碍。",
        theme: "文旅出行问题收集周",
        goal: "收集用户关于交通、门票、亲子、拍照、餐饮和避坑的真实问题",
        frequency: 3,
        ratio: "问答2 / 目的地图集1",
        testHypothesis: "每篇只问一个具体出行问题，会带来更多有效评论。",
        commercializationMove: "本周不强转化，只沉淀下周选题。",
        interactionGoal: "引导用户留言出发城市、同行人、预算和最担心的问题。",
        availableAssets: "目的地现场图、导览图、票务截图；素材不够时优先生成信息卡和补拍清单。"
      }
    ],
    heritage: [
      {
        name: "工艺故事",
        help: "适合民俗/非遗冷启动：先建立真实质感和文化信任。",
        theme: "非遗工艺故事周",
        goal: "提升收藏和体验咨询，收集用户想了解的工艺问题",
        frequency: 4,
        ratio: "工艺故事2 / 制作流程1 / 文化问答1",
        testHypothesis: "真实手作细节 + 制作流程，比单纯成品图更容易建立信任。",
        commercializationMove: "轻量提到体验预约、研学课程或文创购买，不做硬转化。",
        interactionGoal: "引导用户留言想体验的工艺、是否亲子/研学、想了解哪一步。",
        availableAssets: "工艺细节、作品、工具、制作过程、授权人物图。"
      },
      {
        name: "体验预约",
        help: "适合已有工作坊、节庆活动或研学产品的项目。",
        theme: "民俗体验和预约转化周",
        goal: "让用户明确怎么参加、适合谁、时间地点和预约方式",
        frequency: 4,
        ratio: "体验流程2 / 预约信息1 / 节庆活动1",
        testHypothesis: "体验流程图搭配预约信息，会提升咨询和报名意愿。",
        commercializationMove: "自然提到体验预约、亲子研学、团建或节庆活动。",
        interactionGoal: "引导用户留言日期、人数、年龄段、预算和是否需要讲解。",
        availableAssets: "活动现场、体验流程、场地、预约信息、注意事项。"
      },
      {
        name: "文化问答",
        help: "适合纠正常见误解，同时避免把民俗做成猎奇内容。",
        theme: "民俗文化问答周",
        goal: "收集用户对工艺、禁忌、体验方式和拍摄边界的真实问题",
        frequency: 3,
        ratio: "文化问答2 / 工艺图集1",
        testHypothesis: "尊重边界的问答内容，会比猎奇标题更利于长期信任。",
        commercializationMove: "本周只沉淀问题和信任，不强转化。",
        interactionGoal: "引导用户留言想知道的文化背景、能不能拍照、适不适合孩子。",
        availableAssets: "作品、流程、活动现场、授权说明；缺授权时只做内部参考。"
      }
    ],
    stay: [
      {
        name: "房型空间",
        help: "适合民宿/酒店/营地冷启动：先把真实空间讲清楚。",
        theme: "房型空间和入住场景周",
        goal: "提升收藏和日期咨询，让用户判断是否适合入住",
        frequency: 4,
        ratio: "房型空间2 / 周边体验1 / 价格问答1",
        testHypothesis: "真实房型图 + 设施信息，比氛围空镜更容易带来咨询。",
        commercializationMove: "轻量提到订房、套餐、团建或亲子活动。",
        interactionGoal: "引导用户留言日期、人数、预算、亲子/宠物/停车需求。",
        availableAssets: "房间、窗景、公共区、早餐、营地设施、周边体验照片。"
      },
      {
        name: "周边体验",
        help: "适合把住宿从单一房间扩展成周末目的地。",
        theme: "住宿周边玩法周",
        goal: "让用户知道住这里能玩什么、适合几天几夜",
        frequency: 3,
        ratio: "周边体验2 / 房型空间1",
        testHypothesis: "房型图搭配周边动线，会提升收藏和停留时长。",
        commercializationMove: "自然提到套餐、活动、接驳或周边合作。",
        interactionGoal: "引导用户留言是否亲子、是否自驾、想安静还是想活动丰富。",
        availableAssets: "周边景点、路线、餐饮、活动、公共区和房间图。"
      }
    ],
    food: [
      {
        name: "单菜品爆款",
        help: "适合餐饮冷启动：每篇只打透一道菜，让用户先记住招牌。",
        theme: "单菜品图文种草周",
        goal: "提升点击和收藏，收集用户最想点的菜品反馈",
        frequency: 4,
        ratio: "单菜品2 / 菜品细节1 / 环境交通1",
        testHypothesis: "图片文件名直接使用菜名，系统按菜名匹配图片和正文，会比人工挑图更稳定。",
        commercializationMove: "轻量提到预约、套餐或适合几人来吃，不做强促销。",
        interactionGoal: "每篇引导用户留言想看哪道菜、几个人来、有没有忌口、是否需要停车信息。",
        availableAssets: "把图片放到龙虾所在电脑的本地文件夹；文件名用菜名或环境名，例如 清蒸鲈鱼.jpg、竹林土鸡.jpg、包间.jpg、门头.jpg。"
      },
      {
        name: "活动转化",
        help: "适合有团购、节日套餐、上新、限时活动或游客套餐的门店。",
        theme: "营销活动和套餐转化周",
        goal: "让用户明确活动主推菜、适合几个人、多少钱、怎么预约、什么时候结束",
        frequency: 4,
        ratio: "活动主菜2 / 套餐权益1 / 环境交通1",
        testHypothesis: "主菜图 + 活动权益信息卡 + 交通漫画卡，会比只发套餐海报更容易带来到店咨询。",
        commercializationMove: "自然提到团购、预约、节日套餐、活动期限或私域咨询入口，价格和期限必须人工确认。",
        interactionGoal: "引导用户留言人数、预算、是否需要包间、用餐日期和停车问题。",
        availableAssets: "活动主菜图、套餐菜品图、菜单/活动规则图、包间/大厅/门头/停车入口图。"
      },
      {
        name: "当地特色",
        help: "适合游客型、本地菜、农家菜或有地域食材记忆点的门店。",
        theme: "当地特色菜和游客到店周",
        goal: "让用户知道来本地为什么要吃这道菜、适合什么行程后到店",
        frequency: 4,
        ratio: "当地特色2 / 单菜品1 / 环境交通1",
        testHypothesis: "当地特色菜 + 门头/交通漫画卡，会比普通菜品标题更容易吸引游客收藏。",
        commercializationMove: "轻量提示适合游客、家庭、朋友局或逛完某个地点后来吃。",
        interactionGoal: "引导用户留言从哪里出发、几个人、想吃本地菜还是套餐、是否开车。",
        availableAssets: "当地特色菜图、食材/做法图、门头、停车入口、附近地标或交通节点照片。"
      },
      {
        name: "环境交通",
        help: "适合解决用户到店前最现实的问题：环境、包间、停车、怎么走。",
        theme: "餐厅环境和交通指南周",
        goal: "收集用户关于包间、停车、路线、预算和预约的真实问题",
        frequency: 3,
        ratio: "环境交通2 / 菜品种草1",
        testHypothesis: "门头/停车入口漫画卡，会降低用户到店顾虑并提升评论咨询质量。",
        commercializationMove: "本周不强转化，只沉淀到店问题和下周选题。",
        interactionGoal: "每篇引导用户留言人数、预算、包间需求、停车和路线问题。",
        availableAssets: "门头、停车场入口、附近路口、包间、大厅、菜单和 1-2 张主推菜图。"
      }
    ],
    outdoor: [
      {
        name: "路线日记",
        help: "适合冷启动：先让用户记住账号会提供真实、可判断的路线复盘。",
        theme: "户外路线日记周",
        goal: "提升点击和收藏，收集用户最想看的路线问题",
        frequency: 4,
        ratio: "路线日记2 / 关键路况1 / 风景图集1",
        testHypothesis: "真实现场图 + 路线决策信息，比单纯风景图更容易带来收藏。",
        commercializationMove: "轻量提到路线合集或装备清单，不做强转化。",
        interactionGoal: "每篇引导用户留言体力基础、出发季节、交通方式和最担心的问题。",
        availableAssets: "路线图、轨迹截图、现场图、关键路况图；缺图就生成补拍/补资料清单。"
      },
      {
        name: "攻略收藏",
        help: "适合把一条路线讲清楚，让用户觉得能照着走。",
        theme: "户外路线攻略收藏周",
        goal: "让用户明确路线难度、交通补给、时间和适合人群",
        frequency: 4,
        ratio: "路线攻略2 / 轨迹信息1 / 交通补给1",
        testHypothesis: "距离、爬升、起终点、撤退点写清楚，会提升收藏和评论提问。",
        commercializationMove: "可以自然提到路线资料包、地图文件或装备清单。",
        interactionGoal: "引导用户留言是否需要轨迹、交通方式、同行人数和体力水平。",
        availableAssets: "轨迹截图、路线图、交通截图、补给点照片、路况节点图。"
      }
    ],
    museum: [
      {
        name: "展览看点",
        help: "适合展馆/研学冷启动：先让用户知道为什么值得看。",
        theme: "展览看点和观展动线周",
        goal: "提升收藏和预约咨询，让用户明确展期、看点和适合人群",
        frequency: 4,
        ratio: "展览看点2 / 观展动线1 / 预约票务1",
        testHypothesis: "真实展品图 + 观展动线，比单张海报更容易被收藏。",
        commercializationMove: "轻量提到预约票务、讲解服务、研学课程或文创。",
        interactionGoal: "引导用户留言观展时间、孩子年龄、是否需要讲解和最想看的展区。",
        availableAssets: "展品授权图、展厅图、导览图、展期/票务截图、活动照片。"
      },
      {
        name: "亲子研学",
        help: "适合有研学课程、亲子讲解或教育产品的展馆。",
        theme: "亲子研学体验周",
        goal: "让家长明确适合年龄、学习点、时长和预约方式",
        frequency: 3,
        ratio: "研学攻略2 / 展品故事1",
        testHypothesis: "年龄段和学习点写清楚，会提升家长收藏和咨询。",
        commercializationMove: "自然提到研学课程、讲解预约或活动报名。",
        interactionGoal: "引导用户留言孩子年龄、想学主题、可到馆时间。",
        availableAssets: "研学活动、展品故事、教具、讲解空间、预约信息。"
      }
    ],
    product: [
      {
        name: "产品种草",
        help: "适合特产/文创冷启动：先讲清楚产品是什么、适合谁。",
        theme: "地域产品种草周",
        goal: "提升收藏和购买咨询，收集用户对规格价格的反馈",
        frequency: 4,
        ratio: "产品种草2 / 工艺故事1 / 规格价格1",
        testHypothesis: "真实产品图 + 规格价格卡，比单纯氛围图更容易带来咨询。",
        commercializationMove: "轻量提到购买方式、团购、伴手礼或文旅联动。",
        interactionGoal: "引导用户留言用途、预算、口味偏好和送礼对象。",
        availableAssets: "产品、包装、产地、原料、制作过程、规格价格图。"
      },
      {
        name: "礼盒转化",
        help: "适合节日礼盒、伴手礼或文创套装。",
        theme: "伴手礼和礼盒转化周",
        goal: "让用户明确送谁合适、规格价格、怎么购买",
        frequency: 3,
        ratio: "礼盒场景2 / 产品故事1",
        testHypothesis: "送礼场景 + 价格规格，会提升收藏和询价。",
        commercializationMove: "自然提到团购、预订、物流和库存，以人工确认信息为准。",
        interactionGoal: "引导用户留言送礼对象、预算、数量和到货时间。",
        availableAssets: "礼盒、包装、产品细节、使用场景、规格价格表。"
      }
    ],
    service: [
      {
        name: "服务信任",
        help: "适合本地服务冷启动：先把服务流程和边界讲清楚。",
        theme: "本地服务流程和信任周",
        goal: "提升评论咨询和预约意向，降低用户对价格和效果的顾虑",
        frequency: 4,
        ratio: "服务项目2 / 流程细节1 / 价格问答1",
        testHypothesis: "真实流程图 + 价格边界，比单纯案例图更容易建立信任。",
        commercializationMove: "轻量提到预约、套餐、会员或本地咨询。",
        interactionGoal: "引导用户留言预算、时间、顾虑和是否需要预约。",
        availableAssets: "门店空间、服务流程、设备资质、授权案例、价格表。"
      },
      {
        name: "问题问答",
        help: "适合收集用户真实顾虑，后续沉淀 FAQ。",
        theme: "本地服务顾虑问答周",
        goal: "收集用户关于价格、流程、适合人群和风险边界的问题",
        frequency: 3,
        ratio: "问答2 / 流程说明1",
        testHypothesis: "明确说适合谁不适合谁，会提升有效咨询质量。",
        commercializationMove: "本周不强转化，只沉淀 FAQ 和下周选题。",
        interactionGoal: "引导用户留言最担心的问题、可接受预算和希望到店时间。",
        availableAssets: "流程图、设备、门店空间、资质、授权案例。"
      }
    ]
  };
  return presets[mode];
}
