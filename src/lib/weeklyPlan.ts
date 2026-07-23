import type { Account, AccountStrategy, Asset, WeeklyPlan } from "@/types/domain";
import { addDays, format, startOfWeek } from "date-fns";
import { accountVisualMode, isWeddingAccount, type AccountVisualMode } from "@/lib/imagePrompts";

type GenerateWeeklyPlanInput = {
  theme: string;
  goal: string;
  frequency: number;
  ratio: string;
  testHypothesis: string;
  commercializationMove: string;
  interactionGoal: string;
  availableAssets: string;
  weeklyFocus?: string;
  taboos: string;
};

type WeeklyModeConfig = {
  contentTypes: string[];
  fallbackColumns: string[];
  fallbackPainPoint: string;
  fallbackSubject: string;
  fallbackTargetUser: string;
  defaultGoal: string;
  subjectLabel: string;
  coreView: (subject: string) => string;
  bodyStructure: string;
  requiredImages: string;
  coverCopyDirection: (subject: string) => string;
  commentHook: (targetUser: string) => string;
  expectedGoal: string;
};

export function clampWeeklyFrequency(value: unknown, fallback = 5) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  const safeFallback = Math.max(1, Math.min(Number.isFinite(fallback) ? Math.round(fallback) : 5, 7));
  return Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 7)) : safeFallback;
}

export function normalizeWeeklyRatio(value: string, frequency: number) {
  const weights = new Map<string, number>();
  for (const rawItem of value.split("/")) {
    const item = rawItem.trim();
    if (!item) continue;
    const match = item.match(/^(.*?)(\d+)$/);
    const label = (match?.[1] || item).trim();
    const weight = Math.max(1, Number(match?.[2] || 1));
    if (label) weights.set(label, (weights.get(label) || 0) + weight);
  }

  const entries = Array.from(weights, ([label, weight], index) => ({ label, weight, index }));
  if (!entries.length) return "";
  const target = clampWeeklyFrequency(frequency);
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  const allocations = entries.map((entry) => {
    const exact = (entry.weight / totalWeight) * target;
    return { ...entry, count: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let remaining = target - allocations.reduce((sum, entry) => sum + entry.count, 0);

  for (const entry of [...allocations].sort((a, b) => b.remainder - a.remainder || b.weight - a.weight || a.index - b.index)) {
    if (remaining <= 0) break;
    entry.count += 1;
    remaining -= 1;
  }

  return allocations
    .filter((entry) => entry.count > 0)
    .map((entry) => `${entry.label}${entry.count}`)
    .join(" / ");
}

const weeklyModeConfigs: Record<AccountVisualMode, WeeklyModeConfig> = {
  culture_tourism: {
    contentTypes: ["目的地种草", "一日动线", "节庆活动", "拍照机位", "交通票务", "避坑问答", "短视频脚本"],
    fallbackColumns: ["目的地种草", "动线攻略", "节庆活动"],
    fallbackPainPoint: "不知道值不值得去、怎么安排动线、交通票务和活动时间是否靠谱",
    fallbackSubject: "目的地体验",
    fallbackTargetUser: "计划周末出游、亲子出行或城市微度假的用户",
    defaultGoal: "提升收藏、评论咨询和文旅转化",
    subjectLabel: "文旅体验",
    coreView: (subject) => `围绕「${subject}」把真实目的地图、活动现场、动线信息和可核验服务信息组合成一篇能帮助用户决定是否出发的文旅笔记。`,
    bodyStructure: "开头点出目的地吸引力 -> 推荐动线/核心看点 -> 交通票务/开放时间 -> 适合人群和避坑 -> 评论区提问",
    requiredImages: "默认 5 张：封面真实目的地图 + 游览动线图 + 核心看点/活动现场图 + 交通票务信息卡 + 评论互动卡。素材不足时先列补拍/补资料清单；AI 只能基于真实目的地图做 image2 延展。",
    coverCopyDirection: (subject) => `突出「${subject}」和一个明确出行理由，用 8-14 字短句表达“为什么值得去/适合谁”。`,
    commentHook: (targetUser) => `${targetUser}可以在评论区留下出行日期、同行人、交通方式和最想看的体验，我会按评论补下一篇。`,
    expectedGoal: "收藏率、评论咨询、路线/票务需求、关注转化四项至少命中一项。"
  },
  heritage: {
    contentTypes: ["非遗工艺", "民俗活动", "传承人故事", "体验预约", "节庆节点", "文化问答", "短视频脚本"],
    fallbackColumns: ["工艺故事", "活动体验", "预约转化"],
    fallbackPainPoint: "不知道民俗/非遗体验是否值得参加、怎么预约、是否适合亲子或研学",
    fallbackSubject: "民俗非遗体验",
    fallbackTargetUser: "对传统文化、亲子研学和在地体验感兴趣的用户",
    defaultGoal: "提升收藏、体验预约咨询和文化信任",
    subjectLabel: "民俗非遗主题",
    coreView: (subject) => `围绕「${subject}」把真实工艺细节、活动现场、人物/作品授权信息和体验方式组合成一篇尊重文化语境、能转化预约的笔记。`,
    bodyStructure: "开头点出工艺/民俗的体验感 -> 真实流程和故事 -> 怎么参与/适合谁 -> 时间地点/预约/禁忌 -> 评论区提问",
    requiredImages: "默认 5 张：封面真实工艺/活动图 + 制作流程图 + 人物/故事图 + 体验预约信息卡 + 尊重禁忌/互动卡。必须标清授权和文化边界；AI 不得伪造传承人或仪式。",
    coverCopyDirection: (subject) => `突出「${subject}」的真实质感和参与方式，用短句表达“为什么想亲自体验”。`,
    commentHook: (targetUser) => `${targetUser}可以在评论区留下想体验的工艺、出行日期、是否亲子/研学和预算，我会按评论补下一篇。`,
    expectedGoal: "收藏率、体验咨询、研学/活动报名需求、关注转化四项至少命中一项。"
  },
  stay: {
    contentTypes: ["房型空间", "周边体验", "亲子/情侣场景", "价格套餐", "入住攻略", "避坑问答", "短视频脚本"],
    fallbackColumns: ["房型空间", "周边体验", "价格问答"],
    fallbackPainPoint: "怕房型不符、价格不透明、周边没东西玩、不知道是否适合亲子/宠物/情侣",
    fallbackSubject: "住宿体验",
    fallbackTargetUser: "计划周末度假、亲子出行、情侣出游或团建的用户",
    defaultGoal: "提升收藏、评论咨询和订房转化",
    subjectLabel: "住宿主题",
    coreView: (subject) => `围绕「${subject}」把真实房间/景观图、设施图、周边体验和可核验预订信息组合成一篇降低入住决策成本的笔记。`,
    bodyStructure: "开头点出入住场景 -> 房型/景观/设施 -> 周边怎么玩 -> 价格房态/政策 -> 评论区提问",
    requiredImages: "默认 5 张：封面真实房间/景观图 + 房型设施图 + 周边体验图 + 价格预订信息卡 + FAQ 互动卡。AI 不得改变房型、面积、景观和设施。",
    coverCopyDirection: (subject) => `突出「${subject}」和一个入住场景，用短句表达“适合谁来住”。`,
    commentHook: (targetUser) => `${targetUser}可以在评论区留下日期、人数、预算、亲子/宠物/停车需求，我会按评论补下一篇。`,
    expectedGoal: "收藏率、日期咨询、订房需求、关注转化四项至少命中一项。"
  },
  food: {
    contentTypes: ["单菜品种草", "营销活动", "当地特色", "套餐组合", "环境交通", "到店问答", "短视频脚本"],
    fallbackColumns: ["单菜品种草", "营销活动", "当地特色", "环境交通"],
    fallbackPainPoint: "不知道哪道菜最值得点、活动规则是否清楚、是否有当地特色、交通停车是否方便",
    fallbackSubject: "主推菜品/营销活动/当地特色",
    fallbackTargetUser: "本地到店用户",
    defaultGoal: "提升收藏、评论咨询和到店转化",
    subjectLabel: "餐饮到店",
    coreView: (subject) => `围绕「${subject}」明确本篇是单个菜品、营销活动还是当地特色，把同名真实菜品图、套餐/活动图、门店环境图和交通指南漫画卡组合成一篇能帮助用户决定是否到店的笔记。价格、人均、距离、营业时间、停车、活动规则和食材来源未填写时只标记待核验，不生成具体数字或承诺。`,
    bodyStructure: "开头直接点出主推菜/活动/当地特色 -> 讲这道菜或活动为什么值得来 -> 补充套餐/同行场景 -> 展示门店环境和交通停车 -> 评论区收集人数、预算、忌口和到店问题。价格、距离、停车、食材来源、活动优惠只写商家已确认信息；未知写待确认。",
    requiredImages: "默认 6 张：封面真实主推菜图 + 主推菜细节图 + 第二道菜/套餐或活动权益图 + 内部环境图 + 门头/外部环境图 + 交通指南漫画/信息卡。客户图片先存到龙虾所在电脑可访问目录，文件名尽量就是菜品名、环境名或交通节点名；AI 只能基于真实菜品图和真实环境图做 image2 延展，不得凭空伪造菜品、门店或交通信息。交通指南漫画/信息卡只使用已确认地标、停车和路线信息；未确认则生成补资料清单。",
    coverCopyDirection: (subject) => `突出「${subject}」的单菜品卖点、活动利益点或当地特色，用 8-14 字短句表达“为什么值得点/值得来”。`,
    commentHook: (targetUser) => `${targetUser}可以在评论区留下想吃的菜、人数、预算、忌口、到店时间或停车交通问题，我会按评论补下一篇。`,
    expectedGoal: "收藏率、评论咨询、预约/团购点击、关注转化四项至少命中一项。"
  },
  outdoor: {
    contentTypes: ["路线日记", "路线攻略", "风景图集", "装备复盘", "交通补给", "安全提醒", "短视频脚本"],
    fallbackColumns: ["路线日记", "路线攻略", "装备复盘"],
    fallbackPainPoint: "不知道路线难度、交通补给、季节窗口和是否适合自己",
    fallbackSubject: "户外路线",
    fallbackTargetUser: "想找靠谱路线的新手和进阶户外用户",
    defaultGoal: "提升收藏、评论咨询和关注转化",
    subjectLabel: "路线/活动",
    coreView: (subject) => `围绕「${subject}」把真实现场图、路线图/轨迹截图、关键路况和可核验信息组合成一篇能帮助用户决定是否出发的笔记。`,
    bodyStructure: "开头点出路线亮点 -> 距离/爬升/难度 -> 关键路况和风景节点 -> 交通/补给/装备 -> 安全核验和评论区提问",
    requiredImages: "默认 5 张：封面真实现场图 + 路线图/轨迹截图 + 关键路况图 + 风景情绪图 + 装备/注意事项信息卡。AI 只能基于真实现场图做 image2 延展，不得凭空伪造风景、轨迹或路况。",
    coverCopyDirection: (subject) => `突出「${subject}」和一个明确路线判断，用 8-14 字短句表达“为什么值得走/适合谁”。`,
    commentHook: (targetUser) => `${targetUser}可以在评论区留下体力基础、出发季节、交通方式、是否独行和最担心的问题，我会按评论补下一篇。`,
    expectedGoal: "收藏率、评论咨询、关注转化、路线资料需求四项至少命中一项。"
  },
  museum: {
    contentTypes: ["展览看点", "亲子研学", "路线动线", "馆藏故事", "预约票务", "观展问答", "短视频脚本"],
    fallbackColumns: ["展览看点", "研学攻略", "预约票务"],
    fallbackPainPoint: "不知道展览值不值得看、孩子是否适合、怎么预约、展期和拍摄规则是什么",
    fallbackSubject: "展览/研学体验",
    fallbackTargetUser: "亲子家庭、研学机构、城市文化爱好者和周末观展用户",
    defaultGoal: "提升收藏、预约咨询和研学/票务转化",
    subjectLabel: "展览/研学主题",
    coreView: (subject) => `围绕「${subject}」把真实展品/展厅图、观展动线、展品故事和预约票务信息组合成一篇能帮助用户安排观展的笔记。`,
    bodyStructure: "开头点出展览看点 -> 展品/展厅故事 -> 观展动线和适合人群 -> 预约票务/拍摄规则 -> 评论区提问",
    requiredImages: "默认 5 张：封面真实展品/展厅图 + 观展动线图 + 核心展品故事图 + 预约票务信息卡 + 亲子/研学互动卡。必须核验拍摄规则和版权限制。",
    coverCopyDirection: (subject) => `突出「${subject}」和适合人群，用短句表达“为什么值得看/值得带孩子来”。`,
    commentHook: (targetUser) => `${targetUser}可以在评论区留下观展时间、孩子年龄、是否需要讲解和最想看的展区，我会按评论补下一篇。`,
    expectedGoal: "收藏率、预约/票务咨询、研学需求、关注转化四项至少命中一项。"
  },
  product: {
    contentTypes: ["产品种草", "产地故事", "制作工艺", "礼盒场景", "购买指南", "FAQ 问答", "短视频脚本"],
    fallbackColumns: ["产品种草", "产地故事", "礼盒转化"],
    fallbackPainPoint: "不知道产品是否真实、规格价格是否清楚、送礼是否合适、怎么买更靠谱",
    fallbackSubject: "地域特产/文创产品",
    fallbackTargetUser: "旅行购买伴手礼、本地特产消费者和文化礼物用户",
    defaultGoal: "提升收藏、评论咨询和产品转化",
    subjectLabel: "产品/礼盒",
    coreView: (subject) => `围绕「${subject}」把真实产品图、产地/工艺图、使用场景和规格价格信息组合成一篇能帮助用户判断是否购买的笔记。`,
    bodyStructure: "开头点出产品记忆点 -> 产地/工艺/用途 -> 适合送谁/怎么用 -> 规格价格/物流保存 -> 评论区提问",
    requiredImages: "默认 5 张：封面真实产品图 + 原料/工艺图 + 使用/送礼场景图 + 规格价格信息卡 + FAQ 互动卡。AI 不得改变产品外观、规格、包装和产地。",
    coverCopyDirection: (subject) => `突出「${subject}」和一个使用/送礼场景，用短句表达“为什么值得买”。`,
    commentHook: (targetUser) => `${targetUser}可以在评论区留下用途、预算、口味偏好和送礼对象，我会按评论补下一篇。`,
    expectedGoal: "收藏率、评论咨询、购买/团购需求、关注转化四项至少命中一项。"
  },
  service: {
    contentTypes: ["服务项目", "案例过程", "门店空间", "价格套餐", "预约攻略", "顾客问答", "短视频脚本"],
    fallbackColumns: ["服务项目", "案例过程", "价格问答"],
    fallbackPainPoint: "担心服务效果、价格不透明、流程不清楚、隐私和资质是否可靠",
    fallbackSubject: "本地服务项目",
    fallbackTargetUser: "有明确本地生活服务需求、正在比较门店的用户",
    defaultGoal: "提升评论咨询、预约和信任转化",
    subjectLabel: "服务项目",
    coreView: (subject) => `围绕「${subject}」把真实空间、服务流程、设备/资质和价格预约信息组合成一篇降低用户顾虑的笔记。`,
    bodyStructure: "开头点出服务痛点 -> 服务流程/设备/资质 -> 适合谁不适合谁 -> 价格预约/风险边界 -> 评论区提问",
    requiredImages: "默认 5 张：封面真实服务结果/空间图 + 流程细节图 + 设备/资质图 + 价格预约信息卡 + FAQ 互动卡。案例和前后对比必须授权，AI 不得伪造效果。",
    coverCopyDirection: (subject) => `突出「${subject}」和一个明确痛点，用短句表达“为什么可以放心了解”。`,
    commentHook: (targetUser) => `${targetUser}可以在评论区留下预算、时间、顾虑和是否需要预约，我会按评论补下一篇。`,
    expectedGoal: "评论咨询、预约意向、信任提升、关注转化四项至少命中一项。"
  }
};

const weddingWeeklyConfig: WeeklyModeConfig = {
  contentTypes: ["婚礼细节拆解", "真实案例风格", "婚礼蛋糕", "花艺布置", "仪式区/迎宾区", "备婚问答", "短视频脚本"],
  fallbackColumns: ["图片细节拆解", "爆款风格仿写", "备婚收藏", "案例转化"],
  fallbackPainPoint: "不知道婚礼图片里的细节值不值得参考、适合什么预算/场地/风格、能否真实落地",
  fallbackSubject: "婚礼图片细节",
  fallbackTargetUser: "正在备婚、收集婚礼灵感、比较婚礼策划公司的新人",
  defaultGoal: "提升收藏、评论咨询和婚礼策划预约转化",
  subjectLabel: "婚礼细节",
  coreView: (subject) => `围绕「${subject}」先判断真实婚礼图片里的可写细节，例如婚礼蛋糕、甜品台、花艺、仪式区、迎宾区、桌花、席位卡、灯光或纸品；再选一个最有小红书收藏价值的细节，参考同类型爆款文章的标题节奏和情绪表达，写成备婚用户能保存、能咨询的笔记。`,
  bodyStructure: "开头点出图片里的高记忆点细节 -> 拆解色系/材质/花材/空间层次/适合风格 -> 说明适合什么新人/场地/季节 -> 给备婚落地提醒和待确认信息 -> 评论区收集婚期、城市、预算和喜欢风格",
  requiredImages: "默认 5 张：封面真实婚礼细节图 + 同场景远景/关系图 + 细节近景拆解图 + 风格/预算/适合人群信息卡 + 备婚 FAQ/咨询引导卡。必须基于客户真实婚礼图片先做画面判断，不得伪造新人、宾客、婚礼案例、价格、档期、场地或授权。",
  coverCopyDirection: (subject) => `突出「${subject}」里的一个细节名和备婚收藏理由，用 8-14 字短句表达“为什么这个细节值得抄作业”。`,
  commentHook: (targetUser) => `${targetUser}可以在评论区留下城市、婚期、预算、场地类型和喜欢的风格，我会按图片细节继续拆下一篇。`,
  expectedGoal: "收藏率、评论咨询、私信问价、预约沟通四项至少命中一项。"
};

export function buildNoteTasks(
  account: Account,
  strategy: AccountStrategy | null,
  assets: Asset[],
  input: GenerateWeeklyPlanInput,
  plan: Pick<WeeklyPlan, "id">
) {
  const mode = accountVisualMode(account.accountType);
  const config = mode === "service" && isWeddingAccount(account) ? weddingWeeklyConfig : weeklyModeConfigs[mode];
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const parsedStrategy = strategy ? safeJson(strategy.strategyJson) : {};
  const columns = Array.isArray(parsedStrategy.columns) ? parsedStrategy.columns : config.fallbackColumns;
  const painPoints = account.painPoints.split(/[，,、\n]/).filter(Boolean);
  const subjectCandidates = [input.weeklyFocus || "", account.contentDirections, input.theme, input.availableAssets]
    .join("\n")
    .split(/[，,、\n/]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const targetUser = account.targetUsers || config.fallbackTargetUser;
  const availableAssetNames = assets.slice(0, 8).map((asset) => asset.filePath).join("\n");

  return Array.from({ length: Math.max(1, Math.min(input.frequency || 5, 7)) }).map((_, index) => {
    const date = addDays(weekStart, index);
    const column = columns[index % columns.length];
    const contentType = config.contentTypes[index % config.contentTypes.length];
    const painPoint = painPoints[index % Math.max(painPoints.length, 1)] || config.fallbackPainPoint;
    const subject = subjectCandidates[index % Math.max(subjectCandidates.length, 1)] || config.fallbackSubject;
    return {
      accountId: account.id,
      weeklyPlanId: plan.id,
      publishAt: `${format(date, "yyyy-MM-dd")} 20:30`,
      contentType,
      contentGoal: `${input.goal || config.defaultGoal}；本篇承担「${column}」栏目测试。`,
      topicTitle: `${subject}｜${column}：给${targetUser}的${config.subjectLabel}决策笔记`,
      targetUser,
      painPoint,
      coreView: config.coreView(subject),
      bodyStructure: config.bodyStructure,
      requiredImages: config.requiredImages,
      recommendedAssets: input.availableAssets || availableAssetNames || "从本账号 assets 目录中选择标签匹配的真实素材。",
      coverCopyDirection: config.coverCopyDirection(subject),
      commentHook: config.commentHook(targetUser),
      expectedGoal: config.expectedGoal,
      status: "待生成Prompt"
    };
  });
}

function safeJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}
