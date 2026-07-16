"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BookOpen,
  CalendarDays,
  Clipboard,
  Download,
  FileText,
  Gauge,
  ImageIcon,
  LayoutDashboard,
  Library,
  LogOut,
  MessageCircle,
  NotebookPen,
  Plus,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import {
  createBackendAccount,
  fetchBackendAccountDetail,
  deleteBackendAccount,
  fetchBackendAccounts,
  logout,
  getToken,
  getUser,
  updateBackendAccount,
  type BackendAccountDetail,
  type LoginResponse
} from "@/lib/api";
import { generateStrategyWithBrowserLlm } from "@/lib/browserStrategyLlm";
import { loadBrowserWorkspace, saveBrowserWorkspace } from "@/lib/browserWorkspace";
import { accountTypeTemplates } from "@/data/accountTypeTemplates";
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
  postReviews?: PostReview[];
  expertRules?: ExpertRule[];
  industryKnowledgeResearches?: IndustryKnowledgeResearch[];
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

type PostReview = {
  id: number;
  noteTaskId: number | null;
  inputJson: string;
  prompt: string;
  status: string;
  createdAt: string;
};

type ExpertRule = {
  id: number;
  accountType: string;
  module: string;
  rule: string;
  source: string;
  confidence: number;
  status: string;
  createdAt: string;
};

type IndustryKnowledgeResearch = {
  id: number;
  topic: string;
  searchScope: string;
  commandJson: string;
  researchPrompt: string;
  rawResults: string;
  summaryMarkdown: string;
  status: string;
  createdAt: string;
};

type Asset = {
  id: number;
  filePath: string;
  fileUrl?: string | null;
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

type BatchImagePostsResult = {
  planningPrompt: { content: string; title: string; path: string };
  commands: Array<{ category: string; command: string; description: string; safetyNote: string }>;
};

type SingleImageSourceMode = "ai_generate" | "manual_images" | "folder_select";

type SingleImagePromptOptions = {
  openclawAssetsDir?: string;
  openclawImagePaths?: string;
  imageSourceMode?: SingleImageSourceMode;
  noteContent?: string;
  singleGoal?: string;
  imageCount?: string;
};

const mainTabs = [
  ["dashboard", "工作台", LayoutDashboard],
  ["accounts", "客户账号", ShieldCheck],
  ["weekly", "本周内容", CalendarDays],
  ["images", "图片方案", ImageIcon],
  ["prompts", "笔记草稿", Wand2],
  ["assets", "素材库", Library],
  ["interactions", "发布后互动", MessageCircle],
  ["drafts", "草稿记录", NotebookPen],
  ["reports", "专家复盘", Activity],
  ["learning", "行业学习", BookOpen]
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
  if (["hiking_diary", "outdoor_travel", "mountain_route", "city_walk_nature", "overseas_hiking"].includes(accountType || "")) return "outdoor";
  if (["restaurant", "cafe_bakery", "hotpot_bbq_latenight", "bar_lightmeal"].includes(accountType || "")) return "food";
  if (accountType === "folk_custom_heritage") return "heritage";
  if (accountType === "homestay_hotel_camp") return "stay";
  if (accountType === "museum_exhibition_study") return "museum";
  if (accountType === "regional_product_cultural_creative") return "product";
  if (accountType === "wedding_planning") return "service";
  if (accountType === "local_life_service") return "service";
  return "culture_tourism";
}

function isHikingUiType(accountType?: string) {
  return accountUiMode(accountType) === "outdoor";
}

async function readJsonResponse<T>(res: Response, fallback: T): Promise<T> {
  const text = await res.text();
  if (!text.trim()) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text.slice(0, 300) || "服务返回了无效响应。");
  }
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 100 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function summarizeFiles(files: File[]) {
  return {
    count: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.size, 0)
  };
}

function mergeFiles(current: File[], incoming: File[]) {
  const seen = new Set(current.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
  const merged = [...current];
  for (const file of incoming) {
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(file);
    }
  }
  return merged;
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

  if (accountType === "wedding_planning") {
    return {
      targetUsers: "准备结婚的新人、正在比较婚礼服务的客户、重视审美风格的用户、需要预算透明的用户、本地到店咨询用户、老客转介绍用户",
      painPoints: "预算不透明、案例是否真实、现场效果是否落地、流程是否省心、婚礼风格是否适合自己、档期和价格是否清楚",
      contentDirections: "真实婚礼案例、婚礼服务流程、风格细节拆解、预算避坑、场地/门店空间、预约问答、客户顾虑",
      businessGoals: "增加咨询、提升预约、展示真实婚礼案例、建立信任、促进到店沟通、沉淀私域跟进",
      monetization: "婚礼服务咨询、套餐预约、到店沟通、定制方案、私域跟进",
      materialCondition: "真实婚礼案例图、婚礼服务过程图、场地/门店环境图、客户授权图、价格套餐图、短视频素材、资质/证书图",
      taboos: "不能伪造真实客户案例，不能使用未授权肖像，不能夸大服务效果，不能虚构价格、档期、场地、套餐、资质或顾客评价"
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

  if (accountType === "wedding_planning") {
    return {
      targetUsers: ["准备结婚的新人", "正在比较婚礼服务的客户", "重视审美风格的用户", "需要预算透明的用户", "本地到店咨询用户", "老客转介绍用户"],
      businessGoals: ["增加咨询", "提升预约", "展示真实婚礼案例", "建立信任", "促进到店沟通", "沉淀私域跟进"],
      materialCondition: ["真实婚礼案例图", "婚礼服务过程图", "场地/门店环境图", "客户授权图", "价格套餐图", "短视频素材", "资质/证书图"],
      taboos: ["不伪造真实婚礼案例", "不使用未授权肖像", "不虚构价格/档期", "不夸大落地效果", "不伪造顾客评价", "不泄露客户隐私"]
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
  const normalizedName = name.toLowerCase();
  const prefix =
    accountType === "wedding_planning" || /婚礼|婚庆|婚纱|wedding/.test(normalizedName)
      ? "wedding"
      : accountType === "local_life_service"
        ? "service"
        : accountType.split("_")[0] || "brand";
  return `${prefix}-${String(count + 1).padStart(2, "0")}`;
}

function isGeneratedAccountParam(value: string) {
  return /^[a-z][a-z0-9-]*-\d{2}$/.test(value.trim());
}

function replacePreviousDefault(current: string, previousValue: string, nextValue: string) {
  const trimmed = current.trim();
  return !trimmed || trimmed === previousValue ? nextValue : current;
}

function cleanChoiceCarryover(current: string, previousOptions: string[], nextDefault: string) {
  const previousOptionSet = new Set(previousOptions);
  const tokens = splitChoiceText(current).filter((item) => !previousOptionSet.has(item));
  return tokens.length ? tokens.join("、") : nextDefault;
}

function switchAccountTypeForm(form: ReturnType<typeof emptyAccountForm>, templates: Template[], nextType: string) {
  const previousTemplate = templates.find((item) => item.typeKey === form.accountType);
  const nextTemplate = templates.find((item) => item.typeKey === nextType);
  const previousDefaults = accountTypeDefaults(form.accountType, previousTemplate);
  const nextDefaults = accountTypeDefaults(nextType, nextTemplate);
  const previousChoices = accountChoiceOptions(form.accountType);

  return {
    ...form,
    accountType: nextType,
    accountParam: !form.accountParam.trim() || isGeneratedAccountParam(form.accountParam) ? "" : form.accountParam,
    targetUsers: cleanChoiceCarryover(form.targetUsers, previousChoices.targetUsers, nextDefaults.targetUsers),
    businessGoals: cleanChoiceCarryover(form.businessGoals, previousChoices.businessGoals, nextDefaults.businessGoals),
    materialCondition: cleanChoiceCarryover(form.materialCondition, previousChoices.materialCondition, nextDefaults.materialCondition),
    taboos: cleanChoiceCarryover(form.taboos, previousChoices.taboos, nextDefaults.taboos),
    painPoints: replacePreviousDefault(form.painPoints, previousDefaults.painPoints, nextDefaults.painPoints),
    contentDirections: replacePreviousDefault(form.contentDirections, previousDefaults.contentDirections, nextDefaults.contentDirections),
    monetization: replacePreviousDefault(form.monetization, previousDefaults.monetization, nextDefaults.monetization)
  };
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

function buildLocalTemplates(): Template[] {
  return accountTypeTemplates.map((template, index) => ({
    id: index + 1,
    typeKey: template.typeKey,
    name: template.name,
    defaultColumns: JSON.stringify(template.defaultColumns),
    weeklyRatio: JSON.stringify(template.weeklyRatio)
  }));
}

function createClientId() {
  return Date.now() + Math.floor(Math.random() * 10000);
}

function slugifyClientName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "") || `account-${createClientId()}`;
}

function buildLocalAccount(
  form: ReturnType<typeof hydrateAccountForm>,
  templates: Template[],
  count: number
): Account {
  const id = createClientId();
  const template = templates.find((item) => item.typeKey === form.accountType);
  const slug = slugifyClientName(form.name || `account-${count + 1}`);
  const profilePath = `profiles/${slug}/AGENTS.md`;
  const assetsPath = `assets/${slug}`;
  const typeName = template?.name || form.accountType;
  const positioning = `${form.name}｜${typeName}`;
  const profileContent = `# ${form.name} AGENTS\n\n- 账号类型：${typeName}\n- 账号参数：${form.accountParam}\n- 城市：${form.city || "待补充"}\n- 用户：${form.targetUsers}\n- 痛点：${form.painPoints}\n- 方向：${form.contentDirections}\n- 禁忌：${form.taboos}\n`;

  return {
    id,
    name: form.name,
    accountParam: form.accountParam,
    accountType: form.accountType,
    stage: form.stage,
    personaBase: form.personaBase,
    city: form.city,
    targetUsers: form.targetUsers,
    painPoints: form.painPoints,
    contentDirections: form.contentDirections,
    businessGoals: form.businessGoals,
    monetization: form.monetization,
    referenceAccounts: form.referenceAccounts,
    materialCondition: form.materialCondition,
    taboos: form.taboos,
    profilePath,
    assetsPath,
    strategy: {
      markdown: `# ${form.name} 策划案\n\n- 账号定位：${positioning}\n- 目标：${form.businessGoals}\n- 变现：${form.monetization}\n`,
      positioning,
      execGuide: "浏览器本地模式：只生成方案，不自动发布。"
    },
    profile: {
      content: profileContent,
      version: 1,
      path: profilePath
    },
    referenceResearches: [],
    imageStyleStudies: [],
    interactionPlans: [],
    postReviews: [],
    expertRules: [],
    industryKnowledgeResearches: [],
    assets: [],
    weeklyPlans: []
  };
}

function mapBackendAccountToUiAccount(account: BackendAccountDetail): Account {
  return {
    id: account.id,
    name: account.name,
    accountParam: account.accountParam,
    accountType: account.accountType,
    stage: account.stage,
    personaBase: account.personaBase,
    city: account.city,
    targetUsers: account.targetUsers,
    painPoints: account.painPoints,
    contentDirections: account.contentDirections,
    businessGoals: account.businessGoals,
    monetization: account.monetization,
    referenceAccounts: account.referenceAccounts,
    materialCondition: account.materialCondition,
    taboos: account.taboos,
    profilePath: account.profilePath || "",
    assetsPath: account.assetsPath || "",
    strategy: account.strategyMarkdown
      ? {
          markdown: account.strategyMarkdown,
          positioning: account.strategyPositioning || `${account.name}｜${account.accountType}`,
          execGuide: account.strategyExecGuide || ""
        }
      : null,
    profile: account.profilePath
      ? { content: account.profileContent || "", version: account.profileVersion || 1, path: account.profilePath }
      : null,
    referenceResearches: [],
    imageStyleStudies: [],
    interactionPlans: [],
    postReviews: [],
    expertRules: [],
    industryKnowledgeResearches: [],
    assets: [],
    weeklyPlans: []
  };
}

function buildBackendFallbackStrategyMarkdown(account: Pick<Account, "name" | "accountType" | "businessGoals" | "contentDirections">) {
  return `# ${account.name || "该账号"} 账号运营策划方案

## 账号定位
${account.name || "该账号"}｜${account.accountType || "通用账号"}

## 目标
${account.businessGoals || "提升收藏、咨询和转化"}

## 内容方向
${account.contentDirections || "真实素材、用户痛点、服务信息、风险边界"}

## 风险边界
只生成方案，不自动发布；价格、活动、档期、资质、案例授权等信息发布前必须人工核验。`;
}

function needsAiStrategy(account: Account) {
  const markdown = account.strategy?.markdown?.trim();
  if (!markdown) return true;
  return markdown === buildBackendFallbackStrategyMarkdown(account).trim();
}

function mergeBackendAccountWithLocalState(account: Account, local?: Account): Account {
  if (!local) return account;

  return {
    ...account,
    referenceResearches: local.referenceResearches?.length ? local.referenceResearches : account.referenceResearches,
    imageStyleStudies: local.imageStyleStudies?.length ? local.imageStyleStudies : account.imageStyleStudies,
    interactionPlans: local.interactionPlans?.length ? local.interactionPlans : account.interactionPlans,
    postReviews: local.postReviews?.length ? local.postReviews : account.postReviews,
    expertRules: local.expertRules?.length ? local.expertRules : account.expertRules,
    industryKnowledgeResearches: local.industryKnowledgeResearches?.length
      ? local.industryKnowledgeResearches
      : account.industryKnowledgeResearches,
    assets: local.assets?.length ? local.assets : account.assets,
    weeklyPlans: local.weeklyPlans?.length ? local.weeklyPlans : account.weeklyPlans
  };
}

export function XhsMasterApp() {
  const localTemplates = useMemo(() => buildLocalTemplates(), []);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number][0]>("dashboard");
  const [accountForm, setAccountForm] = useState(emptyAccountForm([]));
  const [profileContent, setProfileContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [currentUser, setCurrentUser] = useState<LoginResponse | null>(null);
  const [promptResults, setPromptResults] = useState<Record<number, PromptResult>>({});
  const [imagePromptResults, setImagePromptResults] = useState<Record<number, ImagePromptResult>>({});
  const [batchImagePostResults, setBatchImagePostResults] = useState<Record<number, BatchImagePostsResult>>({});
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
  const [postReviewPrompt, setPostReviewPrompt] = useState("");
  const [industryLearningDraft, setIndustryLearningDraft] = useState<{
    research?: IndustryKnowledgeResearch;
    commands?: Array<{ category: string; command: string; description: string; safetyNote: string }>;
    researchPrompt?: string;
  }>({});
  const [browserReady, setBrowserReady] = useState(false);

  const selected = useMemo(() => accounts.find((account) => account.id === selectedId) ?? accounts[0], [accounts, selectedId]);
  const latestPlan = selected?.weeklyPlans?.[0];
  const selectedNote = latestPlan?.noteTasks?.find((task) => task.id === selectedNoteId) ?? latestPlan?.noteTasks?.[0];

  useEffect(() => {
    setCurrentUser(getUser());
    setTemplates(localTemplates);
    loadBrowserWorkspace()
      .then((snapshot) => {
        setAccounts((snapshot.accounts as Account[]) || []);
        setTemplates((snapshot.templates as Template[])?.length ? (snapshot.templates as Template[]) : localTemplates);
        setSelectedId(typeof snapshot.selectedId === "number" ? snapshot.selectedId : null);
        setPromptResults((snapshot.promptResults as Record<number, PromptResult>) || {});
        setImagePromptResults((snapshot.imagePromptResults as Record<number, ImagePromptResult>) || {});
        setBatchImagePostResults((snapshot.batchImagePostResults as Record<number, BatchImagePostsResult>) || {});
        setReferenceDraft((snapshot.referenceDraft as typeof referenceDraft) || {});
        setImageStyleDraft((snapshot.imageStyleDraft as typeof imageStyleDraft) || {});
        setInteractionDraft((snapshot.interactionDraft as typeof interactionDraft) || {});
        setPostReviewPrompt(snapshot.postReviewPrompt || "");
        setIndustryLearningDraft((snapshot.industryLearningDraft as typeof industryLearningDraft) || {});
        return snapshot;
      })
      .then(async (snapshot) => {
        if (!getToken()) return;
        const backendAccounts = await fetchBackendAccounts().catch(() => []);
        if (!backendAccounts.length) return;

        const localAccountMap = new Map((((snapshot.accounts as Account[]) || [])).map((account) => [account.id, account]));
        const mappedAccounts = backendAccounts.map((account) =>
          mergeBackendAccountWithLocalState(mapBackendAccountToUiAccount(account), localAccountMap.get(account.id))
        );
        setAccounts(mappedAccounts);
        if (!snapshot?.selectedId && mappedAccounts[0]) {
          setSelectedId(mappedAccounts[0].id);
        }
      })
      .catch((error) => {
        showToast(error instanceof Error ? error.message : "加载账号列表失败。");
      })
      .finally(() => setBrowserReady(true));
  }, [localTemplates]);

  useEffect(() => {
    if (!browserReady) return;
    saveBrowserWorkspace({
      accounts,
      templates,
      selectedId,
      promptResults,
      imagePromptResults,
      batchImagePostResults,
      referenceDraft,
      imageStyleDraft,
      interactionDraft,
      postReviewPrompt,
      industryLearningDraft
    }).catch(() => {
      // 浏览器数据库写失败时不打断当前操作，仅在后续用户动作中继续使用内存态。
    });
  }, [
    browserReady,
    accounts,
    templates,
    selectedId,
    promptResults,
    imagePromptResults,
    batchImagePostResults,
    referenceDraft,
    imageStyleDraft,
    interactionDraft,
    postReviewPrompt,
    industryLearningDraft
  ]);

  useEffect(() => {
    if (templates.length && !accountForm.accountType) setAccountForm(emptyAccountForm(templates));
  }, [templates, accountForm.accountType]);

  useEffect(() => {
    if (selected?.profile?.content) setProfileContent(selected.profile.content);
    if (selected && selectedId === null) setSelectedId(selected.id);
    if (latestPlan?.noteTasks?.[0] && !selectedNoteId) setSelectedNoteId(latestPlan.noteTasks[0].id);
  }, [selected, selectedId, latestPlan, selectedNoteId]);

  async function refresh() {
    const snapshot = await loadBrowserWorkspace();
    const nextTemplates = (snapshot.templates as Template[])?.length ? (snapshot.templates as Template[]) : localTemplates;
    const localAccounts = (snapshot.accounts as Account[]) || [];
    let nextAccounts = localAccounts;

    if (getToken()) {
      const backendAccounts = await fetchBackendAccounts().catch(() => []);
      if (backendAccounts.length) {
        const localAccountMap = new Map(localAccounts.map((account) => [account.id, account]));
        nextAccounts = backendAccounts.map((account) =>
          mergeBackendAccountWithLocalState(mapBackendAccountToUiAccount(account), localAccountMap.get(account.id))
        );
      }
    }

    setAccounts(nextAccounts);
    setTemplates(nextTemplates);
    if (!selectedId && nextAccounts[0]) setSelectedId(nextAccounts[0].id);
    if (nextTemplates?.length) setAccountForm((current) => (current.accountType ? current : emptyAccountForm(nextTemplates)));
    return nextAccounts;
  }

  function replaceAccount(nextAccount: Account) {
    setAccounts((current) => current.map((account) => (account.id === nextAccount.id ? nextAccount : account)));
  }

  function updateSelectedAccount(mutator: (account: Account) => Account) {
    if (!selected) return;
    setAccounts((current) => current.map((account) => (account.id === selected.id ? mutator(account) : account)));
  }

  async function generateAndPersistStrategy(account: Account) {
    const result = await generateStrategyWithBrowserLlm(account);

    await updateBackendAccount({
      id: account.id,
      strategyMarkdown: result.data.markdown,
      profileContent: result.data.agentsMdContent
    });

    return result as {
      usedLlm: boolean;
      error?: string | null;
      data: { markdown: string; positioning: string; execGuide: string; agentsMdContent: string };
    };
  }

  async function createAccount() {
    setLoading(true);
    try {
      const payload = hydrateAccountForm(accountForm, templates, accounts.length);
      const created = await createBackendAccount(payload);
      const createdDetail = await fetchBackendAccountDetail(created.id);
      const createdAccount = mapBackendAccountToUiAccount(createdDetail);
      const strategyResult = await generateAndPersistStrategy(createdAccount);
      const nextAccounts = await refresh();
      const persistedAccount = nextAccounts.find((account) => account.id === created.id) ?? createdAccount;

      setSelectedId(created.id);
      setActiveTab("strategy");
      setAccountForm(emptyAccountForm(templates));
      if (persistedAccount.profile?.content) {
        setProfileContent(persistedAccount.profile.content);
      }
      showToast(strategyResult.usedLlm ? "账号已创建，AI 策划案已生成并保存到后端。" : strategyResult.error || "账号已创建，并已保存默认策划案。");
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
      await deleteBackendAccount(selected.id);
      const remaining = accounts.filter((account) => account.id !== selected.id);
      const nextAccountId = remaining[0]?.id ?? null;
      await refresh();
      setSelectedId(nextAccountId);
      setSelectedNoteId(null);
      setPromptResults({});
      setReferenceDraft({});
      setImageStyleDraft({});
      setInteractionDraft({});
      setPostReviewPrompt("");
      setIndustryLearningDraft({});
      setActiveTab(nextAccountId ? "dashboard" : "accounts");
      showToast("账号已从后端删除。");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "删除账号失败。");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!selected) return;
    setLoading(true);
    updateSelectedAccount((account) => ({
      ...account,
      profile: account.profile
        ? { ...account.profile, content: profileContent, version: (account.profile.version || 0) + 1 }
        : { content: profileContent, version: 1, path: account.profilePath }
    }));
    setLoading(false);
    showToast("配置文件已保存到浏览器。");
  }

  async function uploadAsset(form: HTMLFormElement) {
    if (!selected) return;
    const data = new FormData(form);
    data.set("accountId", String(selected.id));
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
      showToast("登录状态失效，请重新登录后再上传。");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/assets/upload", {
      method: "POST",
      headers: {
        "Xhs-Sign": token,
        "Xhs-Person": String(user.uid),
        "Xhs-Time": Math.floor(Date.now() / 1000).toString(),
        "Xhs-Request-Id": `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        "Xhs-Test": "1"
      },
      body: data
    });
    if (res.ok) {
      const result = await res.json().catch(() => ({ count: 1, assets: [] }));
      form.reset();
      if (Array.isArray(result.assets?.length ? result.assets : result.assets)) {
        updateSelectedAccount((account) => ({
          ...account,
          assets: [...(result.assets || []), ...account.assets]
        }));
      }
      showToast(`已上传 ${result.count || 1} 个素材，并同步了可访问 URL。`);
    } else {
      const result = await res.json().catch(() => ({ error: "上传失败。" }));
      showToast(result.error || "上传失败。");
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
        body: JSON.stringify({
          ...payload,
          existingFilePaths: selected.assets.map((asset) => asset.filePath)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "批量导入素材失败。");
      updateSelectedAccount((account) => ({
        ...account,
        assetsPath: data.folderPath || account.assetsPath,
        assets: [...(data.assets || []), ...account.assets]
      }));
      showToast(`已批量导入 ${data.imported} 个素材，跳过 ${data.skipped} 个已存在文件。`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "批量导入素材失败。");
    } finally {
      setLoading(false);
    }
  }

  async function generateManifest() {
    if (!selected) return;
    const res = await fetch("/api/assets/manifest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ account: selected, assets: selected.assets })
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
        body: JSON.stringify({ ...payload, account: selected })
      });
      const plan = await res.json();
      if (!res.ok) throw new Error(plan.error || "生成计划失败。");
      updateSelectedAccount((account) => ({
        ...account,
        weeklyPlans: [plan, ...(account.weeklyPlans || [])]
      }));
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
    try {
      const res = await fetch(`/api/accounts/${selected.id}/reference-research`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "prepare", account: selected })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成爆款研究失败。");
      setReferenceDraft({ research: data.research, commands: data.commands, researchPrompt: data.researchPrompt });
      setLoading(false);
      showToast("爆款研究已生成。");
    } catch (error) {
      setLoading(false);
      showToast(error instanceof Error ? error.message : "生成爆款研究失败。");
    }
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
        account: selected,
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
    if (data.account) {
      replaceAccount(data.account);
      await updateBackendAccount({
        id: selected.id,
        referenceAccounts: data.account.referenceAccounts,
        strategyMarkdown: data.account.strategy?.markdown || "",
        profileContent: data.account.profile?.content || ""
      });
    }
    await refresh();
    setProfileContent(data.account?.profile?.content || profileContent);
    setLoading(false);
    showToast("已基于爆款研究增强策划案和配置文件。");
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
    if (!selected || !latestPlan) return;
    setLoading(true);
    const res = await fetch(`/api/note-tasks/${task.id}/prompt`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ account: selected, noteTask: task, weeklyPlan: latestPlan })
    });
    const data = await res.json();
    setPromptResults((current) => ({ ...current, [task.id]: data }));
    updateSelectedAccount((account) => ({
      ...account,
      weeklyPlans: account.weeklyPlans.map((plan) =>
        plan.id !== latestPlan.id
          ? plan
          : {
              ...plan,
              noteTasks: plan.noteTasks.map((item) => (item.id === task.id ? { ...item, status: "已生成Prompt" } : item))
            }
      )
    }));
    setLoading(false);
    showToast("正文草稿和执行命令已生成。");
  }

  async function generateImagePrompt(task: NoteTask, options?: SingleImagePromptOptions) {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/note-tasks/${task.id}/image-prompt`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...(options || {}), account: selected, noteTask: task })
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

  async function generateBatchImagePosts(options?: { weeks?: string; openclawAssetsDir?: string; openclawImagePaths?: string; planningGoal?: string }) {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}/batch-image-posts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(options || {})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成批量图片帖子失败。");
      setBatchImagePostResults((current) => ({ ...current, [selected.id]: data }));
      showToast("批量图片帖子任务已生成。");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "生成批量图片帖子失败。");
    } finally {
      setLoading(false);
    }
  }

  async function saveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedNote) return;
    setLoading(true);
    updateSelectedAccount((account) => ({
      ...account,
      weeklyPlans: account.weeklyPlans.map((plan) => ({
        ...plan,
        noteTasks: plan.noteTasks.map((task) => (task.id === selectedNote.id ? { ...task, status: "已保存草稿" } : task))
      }))
    }));
    setLoading(false);
    showToast("草稿状态已保存到浏览器。");
  }

  async function generatePostReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}/post-reviews`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          noteTaskId: form.get("noteTaskId") || selectedNote?.id || null,
          postTitle: form.get("postTitle"),
          postUrl: form.get("postUrl"),
          publishedAt: form.get("publishedAt"),
          actualContent: form.get("actualContent"),
          metrics: form.get("metrics"),
          comments: form.get("comments"),
          expertFeedback: form.get("expertFeedback"),
          editComparison: form.get("editComparison"),
          subjective: form.get("subjective"),
          distillGoal: form.get("distillGoal")
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成单帖复盘失败。");
      setPostReviewPrompt(data.prompt || "");
      await refresh();
      downloadText(`post-review-${selected.name}.md`, data.prompt || "");
      showToast("单帖专家复盘 Prompt 已生成并下载。");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "生成单帖复盘失败。");
    } finally {
      setLoading(false);
    }
  }

  async function prepareIndustryLearning(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}/industry-learning`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "prepare",
          topic: form.get("topic"),
          searchScope: form.get("searchScope")
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成行业学习任务失败。");
      setIndustryLearningDraft({ research: data.research, commands: data.commands, researchPrompt: data.researchPrompt });
      await refresh();
      showToast("行业学习任务已生成。");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "生成行业学习任务失败。");
    } finally {
      setLoading(false);
    }
  }

  async function saveIndustryLearning(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}/industry-learning`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "save-results",
          researchId: industryLearningDraft.research?.id || selected.industryKnowledgeResearches?.[0]?.id,
          topic: form.get("topic"),
          searchScope: form.get("searchScope"),
          rawResults: form.get("rawResults"),
          summaryMarkdown: form.get("summaryMarkdown")
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存行业学习失败。");
      setIndustryLearningDraft((current) => ({ ...current, research: data.research }));
      await refresh();
      showToast("行业学习材料已保存。");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "保存行业学习失败。");
    } finally {
      setLoading(false);
    }
  }

  async function saveExpertRules(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${selected.id}/expert-rules`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rulesJson: form.get("rulesJson"),
          source: form.get("source") || "manual"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存规则失败。");
      await refresh();
      showToast(`已保存 ${data.rules?.length || 0} 条候选规则。`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "保存规则失败。");
    } finally {
      setLoading(false);
    }
  }

  async function loadHealth() {
    const res = await fetch("/api/system-health", { cache: "no-store" });
    setHealth(await readJsonResponse(res, { status: "error", checks: [], summary: "系统状态接口返回异常。" }));
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
              {currentUser && (
                <div className="flex items-center gap-2 rounded border border-ink/10 bg-white px-3 py-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal/15 text-xs font-medium text-teal">
                    {currentUser.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium">{currentUser.name}</span>
                  <button
                    type="button"
                    title="登出"
                    onClick={logout}
                    className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded text-ink/50 transition hover:bg-coral/10 hover:text-coral"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              )}
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
              batchImagePostResult={selected ? batchImagePostResults[selected.id] : null}
              generateBatchImagePosts={generateBatchImagePosts}
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
          {activeTab === "reports" && (
            <ReportsPanel
              selected={selected}
              latestPlan={latestPlan}
              selectedNoteId={selectedNote?.id ?? null}
              setSelectedNoteId={setSelectedNoteId}
              generatePostReview={generatePostReview}
              saveExpertRules={saveExpertRules}
              postReviewPrompt={postReviewPrompt}
              copy={copy}
            />
          )}
          {activeTab === "learning" && (
            <IndustryLearningPanel
              selected={selected}
              draft={industryLearningDraft}
              prepareIndustryLearning={prepareIndustryLearning}
              saveIndustryLearning={saveIndustryLearning}
              saveExpertRules={saveExpertRules}
              copy={copy}
              loading={loading}
            />
          )}
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
    ["本周内容", `${selected?.weeklyPlans?.[0]?.noteTasks?.length ?? 0} 篇`, "weekly"],
    ["图片方案", selected?.weeklyPlans?.[0]?.noteTasks?.length ? "可生成" : "待计划", "images"],
    ["笔记草稿", selected?.weeklyPlans?.[0]?.noteTasks?.length ? "可生成" : "待计划", "prompts"],
    ["素材库", `${selected?.assets?.length ?? 0} 个`, "assets"],
    ["发布后互动", selected?.interactionPlans?.[0]?.status || "可选", "interactions"]
  ];
  const optionalCards = [
    ["爆款研究", selected?.referenceResearches?.[0]?.status || "可选增强", "reference"],
    ["配置文件", selected?.profile ? `v${selected.profile.version}` : "自动生成", "agents"]
  ];
  return (
    <div className="mx-auto max-w-[1480px] space-y-5">
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
            创建账号后策划已经可用，可以直接进入素材、本周内容、图片方案和笔记草稿。爆款研究只在需要校准同行风格时再做。
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
  const switchAccountType = (accountType: string) => setAccountForm(switchAccountTypeForm(accountForm, templates, accountType));
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
            <select value={accountForm.accountType} onChange={(e) => switchAccountType(e.target.value)}>
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
              onClick={() => switchAccountType(template.typeKey)}
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
  const taskBrief = commands
    .map((command: any) => [command.category, command.description, command.safetyNote].filter(Boolean).join("｜"))
    .join("\n");
  const researchTask = [taskBrief ? `# 爆款研究任务说明\n${taskBrief}` : "", commandBundle, researchPrompt].filter(Boolean).join("\n\n");
  const hasSearchPack = Boolean(commands.length || researchPrompt);
  const hasSummary = Boolean(summaryMarkdown.trim());

  return (
    <div className="space-y-5">
      <div className="panel">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="section-title">爆款研究</h2>
            <p className="mt-1 max-w-3xl text-sm text-ink/60">
              账号创建后策划已经可用；这页用于吸收全国同类型爆款风格、标题结构、图片顺序和评论痛点。本地内容只作为落地差异补充，避免风格被所在城市局限。
            </p>
          </div>
          <button type="button" onClick={prepareReferenceResearch} disabled={loading} className="primary-button">
            <Search size={17} /> 生成爆款研究
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className={clsx("rounded border p-4", hasSearchPack ? "border-teal/30 bg-teal/5" : "border-ink/10 bg-white")}>
            <div className="text-xs font-medium text-ink/55">1. 搜索要求</div>
            <div className="mt-2 font-semibold">{hasSearchPack ? "已生成" : "待生成"}</div>
          <p className="mt-2 text-sm text-ink/60">复制一条研究任务给龙虾，优先只读搜索全国同类型爆款。</p>
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
              <h2 className="section-title">给龙虾的爆款研究任务</h2>
              <p className="mt-1 text-sm text-ink/60">只需要复制下面这一条任务给龙虾执行。</p>
            </div>
          </div>

          {!hasSearchPack ? (
            <EmptyState text="点击“生成爆款研究”后，这里会出现一条可复制给龙虾的研究任务。" />
          ) : (
            <div className="space-y-3">
              <div className="rounded border border-ink/10 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-medium">爆款研究任务</div>
                  <button type="button" onClick={() => copy(researchTask)} className="secondary-button">
                    <Clipboard size={16} /> 复制
                  </button>
                </div>
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded bg-ink p-3 text-xs leading-5 text-white">{researchTask}</pre>
                <p className="mt-2 text-xs text-coral">只读探索命令，不发布、不关注、不私信、不互动。</p>
              </div>
            </div>
          )}
        </div>

        <form className="panel" onSubmit={saveReferenceResearch}>
          <h2 className="section-title">粘贴参考结果，增强现有策划</h2>
          <p className="mt-1 text-sm text-ink/60">把 xiaohongshu_auto_op 返回的研究报告粘进来，大模型会优先提炼全国爆款规律，并更新当前策划。本地结果只作为补充对照。</p>
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
  const authorizedCount = selected.assets.filter((asset) => ["已授权", "可商用"].includes(asset.authorizationState)).length;
  const pendingCount = selected.assets.filter((asset) => asset.authorizationState === "待确认").length;
  return (
    <div className="space-y-5">
      <div className="panel">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="section-title">素材库</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-ink/60">
              管理整个账号长期可复用的真实素材。只给某一篇笔记临时上传几张图时，去“图片方案 → 单篇精修 → 手动指定图片”更直接。
            </p>
          </div>
          <button type="button" onClick={generateManifest} className="secondary-button">
            <FileText size={17} /> 生成素材清单
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded border border-ink/10 bg-white p-3">
            <div className="text-xs font-medium text-ink/55">已登记素材</div>
            <div className="mt-2 text-2xl font-semibold">{selected.assets.length}</div>
            <p className="mt-1 text-sm text-ink/60">账号级长期素材，会被批量自动模式和文件夹自动选图优先参考。</p>
          </div>
          <div className="rounded border border-ink/10 bg-white p-3">
            <div className="text-xs font-medium text-ink/55">授权状态</div>
            <div className="mt-2 text-sm font-semibold">可用 {authorizedCount} / 待确认 {pendingCount}</div>
            <p className="mt-1 text-sm text-ink/60">未确认肖像、价格、地点、路线、档期或资质时，生成内容必须保留核验提示。</p>
          </div>
          <div className="rounded border border-ink/10 bg-white p-3">
            <div className="text-xs font-medium text-ink/55">龙虾读取目录</div>
            <div className="mt-2 truncate text-sm font-semibold">{selected.assetsPath}</div>
            <p className="mt-1 text-sm text-ink/60">网页上传的文件会落到这个本机目录，龙虾读取的是这些本地文件。</p>
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
            <h2 className="section-title">添加长期素材</h2>
            <p className="text-sm text-ink/60">适合一组以后会反复使用的真实素材；如果只是某篇笔记临时用图，请在“图片方案”里上传。</p>
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
            <span>授权状态</span>
            <select name="authorizationState" defaultValue="待确认">
              {authStates.map((state) => (
                <option key={state}>{state}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded border border-ink/10 bg-white px-3 py-2 text-sm">
            <input name="coverReady" type="checkbox" value="true" /> 适合封面
          </label>
          <details className="rounded border border-ink/10 bg-white p-3 md:col-span-4">
            <summary className="cursor-pointer text-sm font-medium">高级信息（可选）</summary>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <label className="field">
                <span>来源类型</span>
                <select name="sourceType" defaultValue={copyText.source}>
                  {sourceTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>
              <Input name="location" label="拍摄地点" />
              <Input name="shotAt" label="拍摄时间" />
              <Input name="tags" label="标签" placeholder={copyText.singleTags} />
              <Input name="suitableTypes" label="适合什么内容" placeholder={copyText.singleSuitable} />
              <Input name="riskNotes" label="核验/风险备注" placeholder={copyText.singleRisk} />
            </div>
          </details>
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
            <h2 className="section-title">批量上传素材包（高级）</h2>
            <p className="mt-1 text-sm text-ink/60">
              图片特别多、已经在这台电脑或共享盘里整理好时，用这里批量导入整个文件夹；系统会扫描文件并登记到素材库，不重复复制文件。
            </p>
          </div>
          <button type="submit" className="secondary-button">
            <Library size={17} /> 批量上传
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            name="folderPath"
            label="这台电脑可访问的素材文件夹"
            placeholder={copyText.folderPlaceholder}
            help="如果图片在客户其他电脑，先用 U 盘、网盘同步或共享盘挂载到这台电脑；系统会扫描这个文件夹并批量导入素材记录。"
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
        <div className="mb-4">
          <div>
            <h2 className="section-title">已登记素材</h2>
            <p className="mt-1 text-sm text-ink/60">生成素材清单后，系统会知道素材来源、授权状态、适合内容、封面可用性和风险备注。</p>
          </div>
        </div>
        {!selected.assets.length ? (
          <EmptyState text="还没有素材。建议先上传图片；如果是大批量客户素材，再登记已有文件夹。没有真实素材时，只能生成补拍清单、信息卡或辅助图方案。" />
        ) : (
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
            {selected.assets.map((asset) => (
              <div key={asset.id} className="overflow-hidden rounded border border-ink/10 bg-white">
                {(() => {
                  const previewUrl = asset.fileUrl || (asset.filePath.startsWith("/") ? asset.filePath : "");
                  return (
                    <>
                <div className="flex aspect-video items-center justify-center bg-ink/5">
                  {asset.fileType.startsWith("image") && previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt={asset.tags || "asset"} className="h-full w-full object-cover" />
                  ) : asset.fileType.startsWith("video") && previewUrl ? (
                    <video src={previewUrl} className="h-full w-full object-cover" controls />
                  ) : (
                    <div className="grid place-items-center gap-2 px-4 text-center text-xs text-ink/55">
                      <ImageIcon size={28} />
                      <span>{asset.fileUrl ? "远程素材，可直接预览" : "本地路径素材，供龙虾读取"}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-3 text-sm">
                  <div className="truncate font-medium">{asset.filePath}</div>
                  {asset.fileUrl && (
                    <a
                      href={asset.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 truncate text-xs text-teal hover:underline"
                    >
                      <ExternalLink size={13} />
                      <span>{asset.fileUrl}</span>
                    </a>
                  )}
                  <div className="text-ink/60">{asset.sourceType} / {asset.authorizationState}</div>
                  <div>{asset.tags || "未标注标签"}</div>
                  <div className="flex gap-2 text-xs">
                    <span className={clsx("rounded px-2 py-1", asset.coverReady ? "bg-teal/10 text-teal" : "bg-ink/5")}>封面 {asset.coverReady ? "是" : "否"}</span>
                    <span className={clsx("rounded px-2 py-1", asset.used ? "bg-coral/10 text-coral" : "bg-ink/5")}>已用 {asset.used ? "是" : "否"}</span>
                  </div>
                </div>
                    </>
                  );
                })()}
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
  if (account.accountType === "wedding_planning") return true;
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
  generateImagePrompt: (task: NoteTask, options?: SingleImagePromptOptions) => void;
  batchImagePostResult?: BatchImagePostsResult | null;
  generateBatchImagePosts: (options?: { weeks?: string; openclawAssetsDir?: string; openclawImagePaths?: string; planningGoal?: string }) => void;
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
    batchImagePostResult,
    generateBatchImagePosts,
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
  const commandList = [...(batchImagePostResult?.commands || []), ...(result?.commands || [])];
  const [weddingPlanningGoal, setWeddingPlanningGoal] = useState(weddingPlanningGoalPresets[0].value);
  const [imageWorkflowMode, setImageWorkflowMode] = useState<"batch" | "single">("batch");
  const [singleSourceMode, setSingleSourceMode] = useState<SingleImageSourceMode>("folder_select");
  const [singleImageGoal, setSingleImageGoal] = useState("围绕这篇笔记内容，生成封面、图集顺序、图上文字、正文结构和风险核验。");
  const [singleImageCount, setSingleImageCount] = useState("5");
  const [batchUploadFiles, setBatchUploadFiles] = useState<File[]>([]);
  const [singleManualFiles, setSingleManualFiles] = useState<File[]>([]);

  async function uploadFilesWithAuth(files: File[], options?: { suitableTypes?: string; tags?: string }) {
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
      throw new Error("登录状态失效，请重新登录后再上传。");
    }

    const uploadForm = new FormData();
    uploadForm.set("accountId", String(selected?.id || ""));
    uploadForm.set("sourceType", "真实素材");
    uploadForm.set("authorizationState", "待确认");
    uploadForm.set("tags", options?.tags || "");
    uploadForm.set("suitableTypes", options?.suitableTypes || "");
    for (const file of files) uploadForm.append("files", file);

    const uploadRes = await fetch("/api/assets/upload", {
      method: "POST",
      headers: {
        "Xhs-Sign": token,
        "Xhs-Person": String(user.uid),
        "Xhs-Time": Math.floor(Date.now() / 1000).toString(),
        "Xhs-Request-Id": `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        "Xhs-Test": "1"
      },
      body: uploadForm
    });
    const uploadData = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
      throw new Error(uploadData.error || "上传图片失败。");
    }
    return uploadData as { count?: number; assets?: Array<{ filePath: string; localFilePath?: string }> };
  }

  {
    const batchCommand = batchImagePostResult?.commands?.[0];
    const activeSingleCommand = result?.commands?.[0];
    const accountKindLabel = isWedding ? "婚礼现场图" : "素材图片";
    const batchTitle = isWedding ? "用婚礼现场图自动生成批量帖子" : "用素材文件夹自动生成批量帖子";
    const batchDescription = isWedding
      ? "适合已经有一批婚礼现场图，但还没有想好每篇发什么。龙虾会先读图，再结合全国同类型爆款，直接产出多篇帖子方案。"
      : "适合已经有一批素材图，但还没有想好每篇发什么。龙虾会先读图，再结合全国同类型爆款，直接产出多篇帖子方案。";
    const defaultBatchGoal = isWedding
      ? "例如：优先从婚礼蛋糕、花艺、仪式区、迎宾区、桌花中找高收藏选题。"
      : "例如：优先从真实素材里找高收藏主题，直接生成一周内容。";
    return (
      <div className="space-y-5">
        <div className="panel">
          <div className="mb-4">
            <h2 className="section-title">图片生成帖子</h2>
            <p className="mt-1 text-sm text-ink/60">先选择要批量处理一整个文件夹，还是只精修一篇笔记。单篇模式再决定图片由 AI 生成、用户指定，或由龙虾从文件夹自动挑选。</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["batch", "批量自动模式", "给一个素材文件夹，直接生成一周或两周的多篇帖子。"],
              ["single", "单篇精修模式", "先确定一篇笔记，再处理这一篇的图片、图集顺序和正文。"]
            ].map(([mode, title, desc]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setImageWorkflowMode(mode as "batch" | "single")}
                className={clsx("rounded border p-4 text-left transition", imageWorkflowMode === mode ? "border-teal bg-teal/10 ring-2 ring-teal/15" : "border-ink/10 bg-white hover:border-teal/40")}
              >
                <div className="font-semibold">{title}</div>
                <div className="mt-1 text-sm leading-6 text-ink/60">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {imageWorkflowMode === "batch" ? (
          <div className="grid gap-5 xl:grid-cols-[0.42fr_0.58fr]">
            <form
              className="panel border-teal/30"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const run = async () => {
                  let imagePaths = String(form.get("openclawImagePaths") || "");
                  const assetsDir = String(form.get("openclawAssetsDir") || "");
                  if (batchUploadFiles.length) {
                    const uploadData = await uploadFilesWithAuth(batchUploadFiles, {
                      tags: "批量自动模式上传",
                      suitableTypes: selected?.accountType || ""
                    });
                    const uploadedPaths = (uploadData.assets || [])
                      .map((asset) => asset.localFilePath || asset.filePath)
                      .filter(Boolean)
                      .join("\n");
                    imagePaths = [imagePaths, uploadedPaths].filter(Boolean).join("\n");
                  }

                  await generateBatchImagePosts({
                    weeks: String(form.get("weeks") || "1"),
                    openclawAssetsDir: assetsDir,
                    openclawImagePaths: imagePaths,
                    planningGoal: String(form.get("planningGoal") || "")
                  });
                  if (batchUploadFiles.length) {
                    setBatchUploadFiles([]);
                  }
                };
                run().catch((error) => window.alert(error instanceof Error ? error.message : "生成批量帖子任务失败。"));
              }}
            >
              <div className="mb-4">
                <div className="mb-2 inline-flex rounded bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">批量自动模式</div>
                <h2 className="section-title">{batchTitle}</h2>
                <p className="mt-1 text-sm text-ink/60">{batchDescription}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-[160px_1fr]">
                <label className="field">
                  <span>生成周期</span>
                  <select name="weeks" defaultValue="1">
                    <option value="1">一周，约 5-7 篇</option>
                    <option value="2">两周，约 10-14 篇</option>
                  </select>
                </label>
                <Input
                  name="openclawAssetsDir"
                  label={`${accountKindLabel}文件夹${selected?.assets?.length ? `（已登记 ${selected?.assets.length} 张素材）` : ""}`}
                  defaultValue={selected?.assetsPath || ""}
                  placeholder="/Users/.../素材图片"
                  help="把客户提供的一批素材图放在这个文件夹里。"
                />
              </div>

              <div className="mt-3 grid gap-3">
                <label className="field">
                  <span>直接批量上传图片到后端素材库（可选）</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => {
                      const nextFiles = Array.from(event.target.files || []);
                      setBatchUploadFiles((current) => mergeFiles(current, nextFiles));
                      event.currentTarget.value = "";
                    }}
                  />
                  <span className="text-xs text-ink/50">
                    可以一次多选，也可以连续多次选择追加进去。Windows 下可按 `Ctrl` / `Shift` 多选。生成任务前会先走后端批量上传接口，再把这批图加入优先分析范围。
                  </span>
                </label>
                {batchUploadFiles.length > 0 && (
                  <div className="rounded border border-teal/20 bg-teal/5 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium text-teal">
                        已选择 {summarizeFiles(batchUploadFiles).count} 张图，合计 {formatFileSize(summarizeFiles(batchUploadFiles).totalBytes)}
                      </div>
                      <button type="button" className="text-xs text-ink/55 underline-offset-2 hover:underline" onClick={() => setBatchUploadFiles([])}>
                        清空本次选择
                      </button>
                    </div>
                    <div className="mt-2 max-h-32 overflow-auto rounded bg-white/80 px-3 py-2 text-xs text-ink/65">
                      {batchUploadFiles.map((file) => (
                        <div key={`${file.name}-${file.size}-${file.lastModified}`}>{file.name} · {formatFileSize(file.size)}</div>
                      ))}
                    </div>
                  </div>
                )}
                <Textarea
                  name="planningGoal"
                  label="批量生成要求"
                  value={weddingPlanningGoal}
                  onChange={setWeddingPlanningGoal}
                  placeholder={defaultBatchGoal}
                  help="这会写进给龙虾的批量任务。"
                />
                <Textarea
                  name="openclawImagePaths"
                  label="优先分析的图片（可选）"
                  placeholder={isWedding ? "婚礼蛋糕.jpg\n香槟色花艺.jpg\n仪式区拱门.jpg\n迎宾牌.jpg" : "封面候选.jpg\n现场图.jpg\n信息截图.jpg"}
                  help="通常不用填；只有想让龙虾优先看某几张图时再填。"
                />
              </div>

              <button type="submit" disabled={loading || !selected} className="primary-button mt-4">
                <Sparkles size={17} /> 生成批量帖子任务
              </button>
              {batchImagePostResult?.planningPrompt.path && <div className="mt-3 rounded bg-teal/10 px-3 py-2 text-xs text-teal">{batchImagePostResult?.planningPrompt.path}</div>}
            </form>

            <div className="panel border-teal/30">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="section-title">批量任务结果</h2>
                  <p className="mt-1 text-sm text-ink/60">一条任务给龙虾：读取文件夹、自动分组选题、生成多篇帖子。</p>
                </div>
                <div className="flex gap-2">
                  <IconButton title="复制批量任务" onClick={() => copy(batchImagePostResult?.planningPrompt.content || "")} icon={<Clipboard size={17} />} />
                  <IconButton title="导出 Markdown" onClick={() => downloadText(`batch-image-posts-${selected?.name || "draft"}.md`, batchImagePostResult?.planningPrompt.content || "")} icon={<Download size={17} />} />
                </div>
              </div>
              {batchCommand && (
                <div className="mb-3 rounded border border-ink/10 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{batchCommand.category}</div>
                      <div className="text-xs text-ink/60">{batchCommand.description}</div>
                    </div>
                    <IconButton title="复制执行命令" onClick={() => copy(batchCommand.command)} icon={<Clipboard size={16} />} />
                  </div>
                  <code className="block overflow-auto rounded bg-ink px-3 py-2 text-xs text-white">{batchCommand.command}</code>
                  <div className="mt-2 text-xs text-coral">{batchCommand.safetyNote}</div>
                </div>
              )}
              <textarea
                className="code-textarea min-h-[620px]"
                value={batchImagePostResult?.planningPrompt.content || "点击左侧“生成批量帖子任务”后，这里会显示完整任务。"}
                readOnly
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[0.42fr_0.58fr]">
            <form
              className="panel"
              onSubmit={(event) => {
                event.preventDefault();
                if (!note) return;
                const form = new FormData(event.currentTarget);
                const run = async () => {
                  let imagePaths = String(form.get("openclawImagePaths") || "");
                  let assetsDir = String(form.get("openclawAssetsDir") || "");
                  if (singleSourceMode === "manual_images") {
                    if (singleManualFiles.length) {
                      const uploadData = await uploadFilesWithAuth(singleManualFiles, {
                        tags: "单篇精修上传",
                        suitableTypes: note.topicTitle
                      });
                      imagePaths = (uploadData.assets || []).map((asset: { filePath: string; localFilePath?: string }) => asset.localFilePath || asset.filePath).join("\n");
                      assetsDir = selected?.assetsPath || assetsDir;
                    }
                  }
                  await generateImagePrompt(note, {
                  imageSourceMode: singleSourceMode,
                  noteContent: String(form.get("noteContent") || ""),
                  singleGoal: String(form.get("singleGoal") || ""),
                  imageCount: String(form.get("imageCount") || ""),
                    openclawAssetsDir: assetsDir,
                    openclawImagePaths: imagePaths
                  });
                  if (singleSourceMode === "manual_images" && singleManualFiles.length) {
                    setSingleManualFiles([]);
                  }
                };
                run().catch((error) => window.alert(error instanceof Error ? error.message : "生成单篇图片方案失败。"));
              }}
            >
              <div className="mb-4">
                <div className="mb-2 inline-flex rounded bg-ink/5 px-3 py-1 text-xs font-semibold text-ink/60">单篇精修模式</div>
                <h2 className="section-title">先确定一篇笔记，再决定图片怎么来</h2>
                <p className="mt-1 text-sm text-ink/60">适合已经有明确选题，只想把这一篇的封面、图集、正文和风险边界打磨清楚。</p>
              </div>

              {plan && note ? (
                <label className="field">
                  <span>选择笔记</span>
                  <select value={note.id} onChange={(event) => setSelectedNoteId(Number(event.target.value))}>
                    {plan.noteTasks.map((task) => (
                      <option key={task.id} value={task.id}>{task.topicTitle}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <EmptyState text="先到“本周内容”生成计划，再回来精修单篇笔记。" />
              )}

              <div className="mt-4">
                <div className="mb-2 text-sm font-medium text-ink/70">图片来源</div>
                <div className="grid gap-2 md:grid-cols-3">
                  {[
                    ["folder_select", "文件夹自动选图", "给一个文件夹，让龙虾按这篇笔记自动挑图。"],
                    ["manual_images", "手动指定图片", "已经挑好图片，让系统排序、写图上文字和正文。"],
                    ["ai_generate", "AI 辅助图", "没有真实图时，只生成信息卡、结构图或低拟真辅助画面。"]
                  ].map(([mode, title, desc]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSingleSourceMode(mode as SingleImageSourceMode)}
                      className={clsx("rounded border p-3 text-left transition", singleSourceMode === mode ? "border-teal bg-teal/10 text-teal" : "border-ink/10 bg-white text-ink/70 hover:border-teal/40")}
                    >
                      <div className="text-sm font-semibold">{title}</div>
                      <div className="mt-1 text-xs leading-5 text-ink/60">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {note && (
                <div className="mt-4 rounded border border-ink/10 bg-white p-3">
                  <div className="text-sm font-medium">当前笔记目标</div>
                  <div className="mt-2 text-sm leading-6 text-ink/65">
                    <div>封面方向：{note.coverCopyDirection || "未设置"}</div>
                    <div>所需图片：{note.requiredImages || "按选题生成图卡结构"}</div>
                    <div>推荐素材：{note.recommendedAssets || "暂无，生成素材缺口"}</div>
                  </div>
                </div>
              )}

              <div className="mt-4 grid gap-3">
                <Textarea
                  name="noteContent"
                  label="这篇笔记内容/方向"
                  defaultValue={note ? [note.coreView, note.bodyStructure].filter(Boolean).join("\n") : ""}
                  placeholder="写清楚这一篇要表达什么，例如：围绕婚礼蛋糕细节，拆解为什么它能提升整场婚礼高级感。"
                />
                <div className="grid gap-3 md:grid-cols-[120px_1fr]">
                  <Input name="imageCount" label="图片数量" defaultValue={singleImageCount} onChange={setSingleImageCount} placeholder="5" />
                  {singleSourceMode === "manual_images" ? (
                    <div className="rounded border border-ink/10 bg-white p-3 text-sm leading-6 text-ink/60">
                      上传的图片会先进入当前账号的服务端素材库，再写入这篇任务的优先图片列表。
                    </div>
                  ) : (
                    <Input
                      name="openclawAssetsDir"
                      label={singleSourceMode === "ai_generate" ? "参考素材文件夹（可选）" : "图片文件夹"}
                      defaultValue={selected?.assetsPath || ""}
                      placeholder="/Users/.../素材图片"
                      help={singleSourceMode === "ai_generate" ? "AI 辅助图不作为真实证据图；有真实素材时仍优先使用真实素材。" : "给一个文件夹，让龙虾从里面自动挑选适合这篇笔记的图片。"}
                    />
                  )}
                </div>
                {singleSourceMode === "manual_images" && (
                  <label className="field">
                    <span>上传这篇要用的图片</span>
                    <input
                      name="manualImageFiles"
                      type="file"
                      accept="image/*"
                      multiple
                      required
                      onChange={(event) => {
                        const nextFiles = Array.from(event.target.files || []);
                        setSingleManualFiles((current) => mergeFiles(current, nextFiles));
                        event.currentTarget.value = "";
                      }}
                    />
                    <span className="text-xs leading-5 text-ink/50">
                      可以一次多选，也可以连续多次选择追加进去。提交时会先批量上传到服务端素材库，再把这批图加入当前任务的优先图片列表。
                    </span>
                  </label>
                )}
                {singleSourceMode === "manual_images" && singleManualFiles.length > 0 && (
                  <div className="rounded border border-teal/20 bg-teal/5 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium text-teal">
                        本篇已选择 {summarizeFiles(singleManualFiles).count} 张图，合计 {formatFileSize(summarizeFiles(singleManualFiles).totalBytes)}
                      </div>
                      <button type="button" className="text-xs text-ink/55 underline-offset-2 hover:underline" onClick={() => setSingleManualFiles([])}>
                        清空本次选择
                      </button>
                    </div>
                    <div className="mt-2 max-h-28 overflow-auto rounded bg-white/80 px-3 py-2 text-xs text-ink/65">
                      {singleManualFiles.map((file) => (
                        <div key={`${file.name}-${file.size}-${file.lastModified}`}>{file.name} · {formatFileSize(file.size)}</div>
                      ))}
                    </div>
                  </div>
                )}
                {singleSourceMode === "manual_images" && <input type="hidden" name="openclawAssetsDir" value={selected?.assetsPath || ""} readOnly />}
                {singleSourceMode !== "manual_images" && <input type="hidden" name="openclawImagePaths" value="" readOnly />}
                <Textarea
                  name="singleGoal"
                  label="本篇精修要求"
                  value={singleImageGoal}
                  onChange={setSingleImageGoal}
                  placeholder="例如：封面要突出蛋糕近景，正文偏备婚收藏，不要虚构价格和新人反馈。"
                />
              </div>

              <button type="submit" disabled={loading || !note} className="primary-button mt-4">
                <ImageIcon size={17} /> {singleSourceMode === "ai_generate" ? "生成 AI 辅助图方案" : singleSourceMode === "manual_images" ? "用指定图片生成单篇方案" : "让龙虾从文件夹自动选图"}
              </button>
            </form>

            <div className="space-y-5">
              <div className="panel">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="section-title">单篇任务结果</h2>
                    <p className="mt-1 text-sm text-ink/60">这里显示当前单篇模式生成的任务和执行命令。</p>
                  </div>
                  <div className="flex gap-2">
                    <IconButton title="复制单篇任务" onClick={() => copy(result?.imagePrompt.content || "")} icon={<Clipboard size={17} />} />
                    <IconButton title="导出 Markdown" onClick={() => downloadText(`note-${note?.id || "draft"}-image-prompt.md`, result?.imagePrompt.content || "")} icon={<Download size={17} />} />
                  </div>
                </div>
                {activeSingleCommand && (
                  <div className="mb-3 rounded border border-ink/10 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{activeSingleCommand.category}</div>
                        <div className="text-xs text-ink/60">{activeSingleCommand.description}</div>
                      </div>
                      <IconButton title="复制执行命令" onClick={() => copy(activeSingleCommand.command)} icon={<Clipboard size={16} />} />
                    </div>
                    <code className="block overflow-auto rounded bg-ink px-3 py-2 text-xs text-white">{activeSingleCommand.command}</code>
                    <div className="mt-2 text-xs text-coral">{activeSingleCommand.safetyNote}</div>
                  </div>
                )}
                <textarea className="code-textarea min-h-[620px]" value={result?.imagePrompt.content || "选择单篇来源并点击生成后，这里会显示完整任务。"} readOnly />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
              generateBatchImagePosts({
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
                label={`婚礼图片文件夹${selected?.assets?.length ? `（已登记 ${selected?.assets.length} 张素材）` : ""}`}
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

            {batchImagePostResult?.planningPrompt.path && (
              <div className="mt-3 rounded bg-teal/10 px-3 py-2 text-xs text-teal">{batchImagePostResult?.planningPrompt.path}</div>
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
              <select value={note?.id || ""} onChange={(event) => setSelectedNoteId(Number(event.target.value))}>
                {plan?.noteTasks.map((task) => (
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
                <div>封面方向：{note?.coverCopyDirection || "未设置"}</div>
                <div>所需图片：{note?.requiredImages || "按选题生成图卡结构"}</div>
                <div>推荐素材：{note?.recommendedAssets || "暂无，生成素材缺口"}</div>
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
                <IconButton title="复制批量规划 Prompt" onClick={() => copy(batchImagePostResult?.planningPrompt.content || "")} icon={<Clipboard size={17} />} />
                <IconButton
                  title="导出 Markdown"
                  onClick={() => downloadText(`wedding-image-plan-${selected?.name || "draft"}.md`, batchImagePostResult?.planningPrompt.content || "")}
                  icon={<Download size={17} />}
                />
              </div>
            </div>
            {batchImagePostResult?.planningPrompt.path && <div className="mb-2 rounded bg-teal/10 px-3 py-2 text-xs text-teal">{batchImagePostResult?.planningPrompt.path}</div>}
            {batchImagePostResult ? (
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
                batchImagePostResult?.planningPrompt.content ||
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
          {result?.imagePrompt.path && <div className="mb-2 rounded bg-teal/10 px-3 py-2 text-xs text-teal">{result?.imagePrompt.path}</div>}
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

function ReportsPanel(props: {
  selected?: Account;
  latestPlan?: WeeklyPlan;
  selectedNoteId: number | null;
  setSelectedNoteId: (id: number) => void;
  generatePostReview: (event: React.FormEvent<HTMLFormElement>) => void;
  saveExpertRules: (event: React.FormEvent<HTMLFormElement>) => void;
  postReviewPrompt: string;
  copy: (text: string) => void;
}) {
  const { selected, latestPlan, selectedNoteId, setSelectedNoteId, generatePostReview, saveExpertRules, postReviewPrompt, copy } = props;
  const note = latestPlan?.noteTasks.find((task) => task.id === selectedNoteId) ?? latestPlan?.noteTasks?.[0];

  if (!selected) return <div className="panel"><EmptyState /></div>;

  return (
    <div className="space-y-5">
      <div className="panel">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="section-title">专家复盘</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-ink/60">
              这里按“每条帖子”复盘。每发完一篇，就把数据、评论、专家改稿和你的观察放进来，生成诊断并沉淀规则。
            </p>
          </div>
          <div className="rounded bg-teal/10 px-3 py-2 text-sm font-medium text-teal">
            已沉淀 {selected.expertRules?.length || 0} 条候选规则
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded border border-ink/10 bg-white p-4">
            <div className="font-semibold">1. 选帖子</div>
            <p className="mt-1 text-sm leading-6 text-ink/60">从本周内容里选一条，也可以手动填写已发布标题。</p>
          </div>
          <div className="rounded border border-ink/10 bg-white p-4">
            <div className="font-semibold">2. 看证据</div>
            <p className="mt-1 text-sm leading-6 text-ink/60">输入曝光、点击、收藏、评论、私信、转化和真实反馈。</p>
          </div>
          <div className="rounded border border-ink/10 bg-white p-4">
            <div className="font-semibold">3. 沉淀规则</div>
            <p className="mt-1 text-sm leading-6 text-ink/60">把输出里的候选规则保存，后续生成内容会逐步吸收。</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(380px,480px)_minmax(0,1fr)]">
        <form className="panel min-w-0" onSubmit={generatePostReview}>
          <div className="mb-4">
            <h2 className="section-title">单篇帖子复盘</h2>
            <p className="mt-1 text-sm text-ink/60">重点不是填完整表格，而是把这篇帖子的真实证据留下来。</p>
          </div>

          <div className="grid gap-3">
            {latestPlan?.noteTasks?.length ? (
              <label className="field">
                <span>选择笔记</span>
                <select name="noteTaskId" value={note?.id ?? ""} onChange={(event) => setSelectedNoteId(Number(event.target.value))}>
                  {latestPlan.noteTasks.map((task) => (
                    <option key={task.id} value={task.id}>{task.topicTitle}</option>
                  ))}
                </select>
              </label>
            ) : (
              <input type="hidden" name="noteTaskId" value="" readOnly />
            )}
            <Input name="postTitle" label="实际发布标题" defaultValue={note?.topicTitle || ""} placeholder="如果和计划标题不同，填最终发布标题" />
            <div className="grid gap-3 md:grid-cols-2">
              <Input name="postUrl" label="帖子链接（可选）" placeholder="粘贴小红书笔记 URL" />
              <Input name="publishedAt" label="发布时间（可选）" defaultValue={note?.publishAt || ""} />
            </div>
            <Textarea
              name="metrics"
              label="发布表现数据"
              placeholder={"曝光：\n点击：\n点赞：\n收藏：\n评论：\n私信：\n转化："}
              help="没有完整后台数据也没关系，先填能看到的。"
            />
            <Textarea name="comments" label="评论区 / 私信 / 用户反馈" placeholder="粘贴典型评论、私信问题、客户反馈。" />
            <details className="rounded border border-ink/10 bg-white p-3">
              <summary className="cursor-pointer text-sm font-medium">补充专家改稿和实际内容（可选）</summary>
              <div className="mt-3 grid gap-3">
                <Textarea name="actualContent" label="实际发布正文 / 图片顺序" placeholder="粘贴最终正文、封面文字、图片顺序。" />
                <Textarea name="expertFeedback" label="专家点评 / 客户反馈" placeholder="专家说哪里需要改、客户最终选择了什么。" />
                <Textarea name="editComparison" label="修改前后对比" placeholder={"原始标题：...\n最终标题：...\n修改理由：..."} />
                <Textarea name="subjective" label="你的观察" placeholder="例如：评论集中问价格；收藏高但私信少；封面像广告。" />
              </div>
            </details>
            <Textarea
              name="distillGoal"
              label="希望沉淀成什么能力"
              defaultValue="提炼这一篇对应的标题规则、封面规则、图片方案规则、正文规则、评论引导规则、风险规则和下次测试变量。"
            />
          </div>

          <button type="submit" className="primary-button mt-4">
            <Send size={17} /> 生成单帖复盘 Prompt
          </button>
        </form>

        <div className="min-w-0 space-y-5">
          <div className="panel min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="section-title">复盘 Prompt</h2>
                <p className="mt-1 text-sm text-ink/60">复制给大模型或龙虾后，把输出中的候选规则粘到下方保存。</p>
              </div>
              <IconButton title="复制" onClick={() => copy(postReviewPrompt)} icon={<Clipboard size={17} />} />
            </div>
            {postReviewPrompt ? <MarkdownBox value={postReviewPrompt} /> : <EmptyState text="生成后这里会显示单帖复盘 Prompt。" />}
          </div>

          <form className="panel" onSubmit={saveExpertRules}>
            <input type="hidden" name="source" value="post_review" readOnly />
            <div className="mb-3">
              <h2 className="section-title">保存候选规则</h2>
              <p className="mt-1 text-sm text-ink/60">
                可选步骤：把复盘输出里的 JSON 规则数组粘贴进来。保存后，后续生成笔记草稿和图片方案时会自动参考这些经验。
              </p>
            </div>
            <Textarea name="rulesJson" label="候选规则 JSON" placeholder={'[{"module":"title","rule":"...","confidence":0.5}]'} />
            <button type="submit" className="secondary-button mt-4">
              <Save size={17} /> 保存到规则库
            </button>
          </form>
        </div>
      </div>

      <div className="panel">
        <div className="mb-3">
          <h2 className="section-title">最近经验</h2>
          <p className="mt-1 text-sm text-ink/60">这些规则会作为内部经验进入后续生成 Prompt，不会直接出现在发布文案里。</p>
        </div>
        {selected.expertRules?.length ? (
          <div className="grid gap-2 md:grid-cols-2">
            {selected.expertRules.slice(0, 8).map((rule) => (
              <div key={rule.id} className="rounded border border-ink/10 bg-white p-3">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-ink/50">
                  <span>{rule.module}</span>
                  <span>{rule.source || "manual"}</span>
                  <span>置信度 {rule.confidence}</span>
                </div>
                <div className="text-sm leading-6">{rule.rule}</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="还没有保存规则。先完成一篇单帖复盘。" />
        )}
      </div>
    </div>
  );
}

function IndustryLearningPanel(props: {
  selected?: Account;
  draft: {
    research?: IndustryKnowledgeResearch;
    commands?: Array<{ category: string; command: string; description: string; safetyNote: string }>;
    researchPrompt?: string;
  };
  prepareIndustryLearning: (event: React.FormEvent<HTMLFormElement>) => void;
  saveIndustryLearning: (event: React.FormEvent<HTMLFormElement>) => void;
  saveExpertRules: (event: React.FormEvent<HTMLFormElement>) => void;
  copy: (text: string) => void;
  loading: boolean;
}) {
  const { selected, draft, prepareIndustryLearning, saveIndustryLearning, saveExpertRules, copy, loading } = props;
  const commands = draft.commands || safeParseCommands(draft.research?.commandJson || selected?.industryKnowledgeResearches?.[0]?.commandJson || "[]");
  const researchPrompt = draft.researchPrompt || draft.research?.researchPrompt || selected?.industryKnowledgeResearches?.[0]?.researchPrompt || "";
  const commandText = commands.map((item) => item.command).join("\n");

  if (!selected) return <div className="panel"><EmptyState /></div>;

  return (
    <div className="space-y-5">
      <div className="panel">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="section-title">行业学习</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-ink/60">
              这里负责持续学习外部经验：全国同类型爆款、运营专家文章、案例拆解和评论痛点。学到的方法再沉淀进规则库。
            </p>
          </div>
          <div className="rounded bg-teal/10 px-3 py-2 text-sm font-medium text-teal">
            研究记录 {selected.industryKnowledgeResearches?.length || 0} 次
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded border border-ink/10 bg-white p-4">
            <div className="font-semibold">1. 广泛搜索</div>
            <p className="mt-1 text-sm leading-6 text-ink/60">全国/全网优先，不被本地内容限制风格。</p>
          </div>
          <div className="rounded border border-ink/10 bg-white p-4">
            <div className="font-semibold">2. 提炼精髓</div>
            <p className="mt-1 text-sm leading-6 text-ink/60">把标题、封面、图文结构、评论转化方法拆出来。</p>
          </div>
          <div className="rounded border border-ink/10 bg-white p-4">
            <div className="font-semibold">3. 更新规则</div>
            <p className="mt-1 text-sm leading-6 text-ink/60">只保存可验证、可复用、能适配当前账号的方法。</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <form className="panel" onSubmit={prepareIndustryLearning}>
            <div className="mb-4">
              <h2 className="section-title">生成学习任务</h2>
              <p className="mt-1 text-sm text-ink/60">默认会要求全国/全网优先，本地只做补充对照。</p>
            </div>
            <div className="grid gap-3">
              <Textarea
                name="topic"
                label="学习主题"
                defaultValue="小红书图文爆款方法、标题封面、图片真实感、评论转化和复盘方法"
              />
              <Input name="searchScope" label="搜索范围" defaultValue="全国 / 全网优先，本地只作为补充" />
            </div>
            <button type="submit" disabled={loading} className="primary-button mt-4">
              <Search size={17} /> 生成行业学习任务
            </button>
          </form>

          <div className="panel">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="section-title">搜索命令</h2>
                <p className="mt-1 text-sm text-ink/60">先执行只读搜索，再把结果粘回右侧。</p>
              </div>
              <IconButton title="复制命令" onClick={() => copy(commandText)} icon={<Clipboard size={17} />} />
            </div>
            {commandText ? <MarkdownBox value={commandText} /> : <EmptyState text="生成任务后这里会显示搜索命令。" />}
          </div>

          <div className="panel">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="section-title">研究 Prompt</h2>
                <p className="mt-1 text-sm text-ink/60">用于让大模型从搜索材料中提炼方法和候选规则。</p>
              </div>
              <IconButton title="复制 Prompt" onClick={() => copy(researchPrompt)} icon={<FileText size={17} />} />
            </div>
            {researchPrompt ? <MarkdownBox value={researchPrompt} /> : <EmptyState text="生成任务后这里会显示研究 Prompt。" />}
          </div>
        </div>

        <div className="space-y-5">
          <form className="panel" onSubmit={saveIndustryLearning}>
            <div className="mb-4">
              <h2 className="section-title">保存学习材料</h2>
              <p className="mt-1 text-sm text-ink/60">粘贴搜索结果、文章摘录或大模型总结，作为之后复盘和规则更新的依据。</p>
            </div>
            <input type="hidden" name="topic" value={draft.research?.topic || selected.industryKnowledgeResearches?.[0]?.topic || ""} readOnly />
            <input type="hidden" name="searchScope" value={draft.research?.searchScope || selected.industryKnowledgeResearches?.[0]?.searchScope || ""} readOnly />
            <Textarea name="rawResults" label="搜索结果 / 文章摘录" placeholder="粘贴小红书搜索结果、文章链接、专家观点摘录、案例拆解。" />
            <Textarea name="summaryMarkdown" label="学习总结（可选）" placeholder="粘贴大模型整理后的方法论和规则候选。" />
            <button type="submit" className="secondary-button mt-4">
              <Save size={17} /> 保存学习材料
            </button>
          </form>

          <form className="panel" onSubmit={saveExpertRules}>
            <input type="hidden" name="source" value="industry_learning" readOnly />
            <div className="mb-3">
              <h2 className="section-title">沉淀为专家规则</h2>
              <p className="mt-1 text-sm text-ink/60">把行业学习输出里的 JSON 规则数组粘贴进来。</p>
            </div>
            <Textarea name="rulesJson" label="候选规则 JSON" placeholder={'[{"module":"cover","rule":"...","source":"expert_article","confidence":0.6}]'} />
            <button type="submit" className="primary-button mt-4">
              <Sparkles size={17} /> 保存到规则库
            </button>
          </form>
        </div>
      </div>
    </div>
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
  return (
    <pre className="max-h-[58vh] w-full max-w-full min-w-0 overflow-auto whitespace-pre-wrap break-words rounded border border-ink/10 bg-white p-4 text-sm leading-6 [overflow-wrap:anywhere]">
      {value}
    </pre>
  );
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
  if (accountType === "wedding_planning") {
    return [
      {
        name: "婚礼细节拆解",
        help: "适合婚礼账号冷启动：先从真实图片里拆出新人最想收藏的细节。",
        theme: "婚礼细节拆解和备婚收藏周",
        goal: "提升收藏和评论咨询，让备婚用户明确哪些细节值得参考、适合什么预算和场地",
        frequency: 4,
        ratio: "细节拆解2 / 真实案例1 / 备婚问答1",
        testHypothesis: "真实婚礼细节图 + 风格/预算/适合人群信息卡，比泛泛案例展示更容易被备婚用户收藏。",
        commercializationMove: "轻量提示婚礼策划咨询、档期、套餐和到店沟通，价格和档期必须人工确认。",
        interactionGoal: "引导用户留言城市、婚期、预算、场地类型和喜欢的婚礼风格。",
        availableAssets: "婚礼蛋糕、甜品台、花艺、仪式区、迎宾牌、桌花、席位卡、灯光布幔、纸品和场地动线等真实婚礼现场图。"
      },
      {
        name: "真实案例转化",
        help: "适合已有真实婚礼案例的策划公司：用授权案例建立信任。",
        theme: "真实婚礼案例和咨询转化周",
        goal: "展示真实案例的审美、流程和落地能力，沉淀有效咨询",
        frequency: 4,
        ratio: "真实案例2 / 风格拆解1 / 预算避坑1",
        testHypothesis: "授权案例 + 细节拆解 + 待确认边界，会比单纯晒图更容易带来高质量咨询。",
        commercializationMove: "自然提到档期咨询、方案沟通、套餐边界和到店预约，不虚构价格和成交。",
        interactionGoal: "引导用户留言婚期、城市、预算、场地、桌数和喜欢的参考风格。",
        availableAssets: "授权婚礼案例图、现场布置图、仪式区、迎宾区、桌面细节、花艺、灯光和流程花絮。"
      }
    ];
  }
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
