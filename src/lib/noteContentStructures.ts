import type { AccountVisualMode } from "@/lib/imagePrompts";

type StructureCategory = AccountVisualMode | "wedding";

type NoteContentStructurePreset = {
  name: string;
  matchKeywords: string[];
  focus: string;
  openingOptions: string[];
  fallbackStructure: string[];
  optionalInformation: string[];
  avoid: string[];
};

type NoteContentStructureLibrary = {
  categoryName: string;
  fallback: NoteContentStructurePreset;
  presets: NoteContentStructurePreset[];
};

export type ResolvedNoteContentStructure = {
  categoryName: string;
  archetypeName: string;
  focus: string;
  contentCandidates: string[];
  structureSource: "note_task" | "library";
  optionalInformation: string[];
  avoid: string[];
};

const genericFallback: NoteContentStructurePreset = {
  name: "单点问题解答",
  matchKeywords: [],
  focus: "围绕当前选题解决一个明确问题",
  openingOptions: ["直接给出结论", "从目标用户最关心的问题切入"],
  fallbackStructure: ["明确问题", "给出依据", "说明适用边界", "给出行动建议"],
  optionalInformation: ["与当前主题直接相关且已经核验的信息"],
  avoid: ["一次堆入多个主题", "使用运营分析或内容生产口吻"]
};

const libraries: Record<StructureCategory, NoteContentStructureLibrary> = {
  culture_tourism: {
    categoryName: "文旅目的地",
    fallback: {
      ...genericFallback,
      focus: "帮助用户判断目的地是否值得去以及如何安排"
    },
    presets: [
      {
        name: "目的地种草",
        matchKeywords: ["目的地种草", "值得去", "打卡", "目的地体验"],
        focus: "用一个清晰理由帮助用户判断是否值得专程前往",
        openingOptions: ["先给适合谁的结论", "从最有记忆点的现场画面切入"],
        fallbackStructure: ["核心吸引点", "适合人群和场景", "真实现场依据", "必要出行提醒"],
        optionalInformation: ["季节", "开放时间", "票务", "交通"],
        avoid: ["景点百科式罗列", "空泛形容好看和震撼"]
      },
      {
        name: "一日动线",
        matchKeywords: ["一日动线", "游览动线", "一日游", "路线安排"],
        focus: "帮助用户用有限时间完成合理游览",
        openingOptions: ["直接给出时间安排结论", "从最容易走回头路的问题切入"],
        fallbackStructure: ["起点和时间条件", "核心游览顺序", "停留和取舍建议", "返程或结束节点"],
        optionalInformation: ["交通", "步行距离", "用餐", "休息点"],
        avoid: ["把所有景点平均分配", "编造精确耗时"]
      },
      {
        name: "节庆活动",
        matchKeywords: ["节庆活动", "活动攻略", "夜游", "演出", "市集"],
        focus: "说明活动看点、参与方式和适用人群",
        openingOptions: ["从活动最值得看的环节切入", "先说明适合哪类参与者"],
        fallbackStructure: ["活动亮点", "时间和参与方式", "适合人群", "需核验事项"],
        optionalInformation: ["票价", "场次", "预约", "天气影响"],
        avoid: ["复制活动公告", "制造虚假现场热度"]
      },
      {
        name: "拍照机位",
        matchKeywords: ["拍照机位", "出片", "拍照攻略", "取景"],
        focus: "帮助用户找到真实可达、适合当前场景的取景位置",
        openingOptions: ["先展示最出片的角度", "从常见拍摄失败原因切入"],
        fallbackStructure: ["机位效果", "到达和取景方式", "光线或时间条件", "现场限制"],
        optionalInformation: ["焦段", "时间", "人流", "天气"],
        avoid: ["承诺必然出片", "推荐不可达或未核验位置"]
      },
      {
        name: "交通票务",
        matchKeywords: ["交通票务", "停车", "怎么去", "预约票务", "门票"],
        focus: "降低用户出发前的信息查询成本",
        openingOptions: ["先回答最关键的交通或票务问题", "用不同出行方式做对比"],
        fallbackStructure: ["适用出行方式", "到达或预约步骤", "费用与限制", "人工核验提醒"],
        optionalInformation: ["停车", "换乘", "票价", "开放时间"],
        avoid: ["混入无关景点介绍", "使用过期票务信息"]
      },
      {
        name: "避坑问答",
        matchKeywords: ["避坑", "问答", "注意事项", "不建议"],
        focus: "回答一个会影响出行决策的具体顾虑",
        openingOptions: ["直接给结论", "从最容易误解的条件切入"],
        fallbackStructure: ["问题结论", "适用条件", "现场依据", "替代选择或建议"],
        optionalInformation: ["天气", "人群", "时间", "服务限制"],
        avoid: ["为了吸引点击夸大问题", "把个别情况说成普遍结论"]
      }
    ]
  },
  heritage: {
    categoryName: "民俗非遗",
    fallback: {
      ...genericFallback,
      focus: "围绕一个真实工艺、作品或体验问题展开"
    },
    presets: [
      {
        name: "工艺细节",
        matchKeywords: ["工艺细节", "非遗工艺", "细节拆解", "材料"],
        focus: "让用户看懂一个具体工艺细节的价值",
        openingOptions: ["从图片里的关键细节切入", "先解释一个容易被忽略的工艺判断"],
        fallbackStructure: ["可见细节", "材料或技法", "为什么重要", "观看或体验建议"],
        optionalInformation: ["材料", "工具", "工序", "保存方式"],
        avoid: ["泛泛讲传统文化", "虚构技法来源"]
      },
      {
        name: "制作流程",
        matchKeywords: ["制作流程", "怎么做", "工序", "手作过程"],
        focus: "解释真实、可核验的制作过程",
        openingOptions: ["从最关键的一道工序切入", "先说明成品最难实现的部分"],
        fallbackStructure: ["成品目标", "关键工序", "易错点", "完成和体验边界"],
        optionalInformation: ["耗时", "材料", "工具", "参与难度"],
        avoid: ["省略关键事实后假装教程", "编造秘方和仪式"]
      },
      {
        name: "作品故事",
        matchKeywords: ["作品故事", "传承人故事", "人物故事", "来历"],
        focus: "围绕有依据的人物或作品建立理解",
        openingOptions: ["从作品背后的具体选择切入", "从一段已核验的人物经历切入"],
        fallbackStructure: ["作品或人物", "关键背景", "细节与意义", "观看或理解建议"],
        optionalInformation: ["年代", "地域", "作者", "用途"],
        avoid: ["神化传承人", "虚构人物经历和作品来源"]
      },
      {
        name: "体验预约",
        matchKeywords: ["体验预约", "手作体验", "亲子体验", "研学"],
        focus: "帮助用户判断体验是否适合并完成预约",
        openingOptions: ["先说明适合谁", "从体验中最有参与感的环节切入"],
        fallbackStructure: ["体验内容", "适合人群", "参与流程", "预约和限制"],
        optionalInformation: ["时长", "年龄", "费用", "场次"],
        avoid: ["把展示活动写成可参与体验", "虚构名额和价格"]
      },
      {
        name: "节庆民俗",
        matchKeywords: ["节庆", "民俗活动", "仪式", "节日"],
        focus: "在尊重文化语境的前提下说明活动内容",
        openingOptions: ["从活动核心看点切入", "先说明观看或参与边界"],
        fallbackStructure: ["活动背景", "真实现场内容", "参与方式", "文化禁忌与核验"],
        optionalInformation: ["时间", "地点", "礼仪", "拍摄限制"],
        avoid: ["猎奇化表达", "滥用族群或宗教符号"]
      },
      {
        name: "文化问答",
        matchKeywords: ["文化问答", "为什么", "有什么讲究", "禁忌"],
        focus: "准确回答一个具体文化问题",
        openingOptions: ["直接回答问题", "先纠正常见误解"],
        fallbackStructure: ["问题结论", "依据和语境", "适用范围", "尊重与参与建议"],
        optionalInformation: ["地域差异", "时间背景", "使用场合"],
        avoid: ["用单一说法代表所有地区", "把推测写成定论"]
      }
    ]
  },
  stay: {
    categoryName: "住宿营地",
    fallback: {
      ...genericFallback,
      focus: "帮助用户解决一个具体入住决策问题"
    },
    presets: [
      {
        name: "房型空间",
        matchKeywords: ["房型空间", "房间", "房型", "空间"],
        focus: "帮助用户判断真实空间是否适合自己的入住场景",
        openingOptions: ["先说明适合谁住", "从空间里最影响体验的细节切入"],
        fallbackStructure: ["空间结论", "可见设施和布局", "适合人群", "限制与核验"],
        optionalInformation: ["面积", "床型", "景观", "设施"],
        avoid: ["把一间房写成全部房型", "夸大空间和景观"]
      },
      {
        name: "入住场景",
        matchKeywords: ["入住场景", "亲子", "情侣", "团建", "宠物"],
        focus: "围绕一个同行场景判断住宿适配度",
        openingOptions: ["从同行人最关心的问题切入", "先给适合或不适合的结论"],
        fallbackStructure: ["场景需求", "匹配的空间或服务", "真实使用细节", "政策核验"],
        optionalInformation: ["亲子", "宠物", "停车", "餐食"],
        avoid: ["一篇覆盖所有客群", "虚构服务承诺"]
      },
      {
        name: "周边体验",
        matchKeywords: ["周边体验", "附近", "周边怎么玩", "周末安排"],
        focus: "说明住宿与一个真实周边体验如何组合",
        openingOptions: ["从一天怎么安排切入", "从最值得搭配的周边项目切入"],
        fallbackStructure: ["周边体验亮点", "与住宿的组合方式", "适合人群", "距离和开放信息核验"],
        optionalInformation: ["距离", "交通", "开放时间", "季节"],
        avoid: ["罗列全部周边", "虚构距离和开放状态"]
      },
      {
        name: "价格套餐",
        matchKeywords: ["价格套餐", "套餐", "预算", "优惠", "多少钱"],
        focus: "帮助用户理解套餐内容、适用条件和价格边界",
        openingOptions: ["先说明套餐适合谁", "从用户最容易误解的费用项切入"],
        fallbackStructure: ["套餐包含内容", "适用场景", "不包含或限制", "价格房态核验"],
        optionalInformation: ["价格", "日期", "人数", "退改"],
        avoid: ["制造虚假优惠", "省略限制条件"]
      },
      {
        name: "入住攻略",
        matchKeywords: ["入住攻略", "怎么安排", "入住流程", "预订"],
        focus: "减少用户从预订到离店的操作成本",
        openingOptions: ["先给关键时间节点", "从最容易遗漏的准备事项切入"],
        fallbackStructure: ["预订前确认", "到店或入住流程", "入住期间安排", "离店和政策提醒"],
        optionalInformation: ["入住时间", "交通", "餐食", "退改"],
        avoid: ["重复介绍全部房型", "使用未确认流程"]
      },
      {
        name: "政策问答",
        matchKeywords: ["政策问答", "避坑问答", "可以带宠物", "退改", "停车"],
        focus: "回答一个会影响预订的具体政策问题",
        openingOptions: ["直接回答可以或不可以", "先说明需要确认的条件"],
        fallbackStructure: ["问题结论", "适用条件", "例外情况", "咨询确认方式"],
        optionalInformation: ["宠物", "儿童", "停车", "退改"],
        avoid: ["将个别日期政策写成长期规则", "含糊承诺"]
      }
    ]
  },
  food: {
    categoryName: "餐饮",
    fallback: {
      ...genericFallback,
      focus: "围绕一个菜品、场景或到店问题展开"
    },
    presets: [
      {
        name: "单菜品种草",
        matchKeywords: ["单菜品", "菜品种草", "招牌菜", "必点"],
        focus: "围绕一道真实菜品说明口感、特点和适合人群",
        openingOptions: ["从第一口的核心特点切入", "先说适合什么口味的人"],
        fallbackStructure: ["菜品记忆点", "可见食材和口感", "适合人群", "点单建议"],
        optionalInformation: ["做法", "分量", "价格", "辣度"],
        avoid: ["一篇散讲多道菜", "虚构食材等级和口感体验"]
      },
      {
        name: "套餐组合",
        matchKeywords: ["套餐组合", "双人餐", "多人餐", "怎么点"],
        focus: "帮助用户按人数和场景完成点单",
        openingOptions: ["先给人数和预算结论", "从最容易点多或点少的问题切入"],
        fallbackStructure: ["适用人数和场景", "菜品组合逻辑", "加减菜建议", "价格核验"],
        optionalInformation: ["人数", "预算", "忌口", "分量"],
        avoid: ["把所有菜都写成必点", "虚构优惠和分量"]
      },
      {
        name: "当地特色",
        matchKeywords: ["当地特色", "本地菜", "地方味道", "特色菜"],
        focus: "解释一道当地特色为什么值得尝试",
        openingOptions: ["从本地吃法切入", "先说明外地用户可能不习惯的特点"],
        fallbackStructure: ["特色来源", "味型或做法", "适合人群", "点单搭配"],
        optionalInformation: ["产地", "季节", "做法", "口味"],
        avoid: ["把营销说法当历史事实", "泛化地方饮食"]
      },
      {
        name: "制作过程",
        matchKeywords: ["制作过程", "后厨", "怎么做", "现做"],
        focus: "用可见步骤建立菜品可信度",
        openingOptions: ["从最关键的一道工序切入", "从成品特点反推制作过程"],
        fallbackStructure: ["成品特点", "真实制作步骤", "关键细节", "待核验信息"],
        optionalInformation: ["食材", "火候", "时间", "工艺"],
        avoid: ["虚构后厨过程", "泄露或编造配方"]
      },
      {
        name: "环境交通",
        matchKeywords: ["环境交通", "门店环境", "停车", "怎么去"],
        focus: "帮助用户判断到店场景和交通便利度",
        openingOptions: ["先说明适合的聚餐场景", "从停车或到店难点切入"],
        fallbackStructure: ["环境和场景", "座位或空间", "到店方式", "停车与营业信息核验"],
        optionalInformation: ["包厢", "停车", "营业时间", "预约"],
        avoid: ["混入大量菜品介绍", "承诺未确认的停车便利"]
      },
      {
        name: "营销活动",
        matchKeywords: ["营销活动", "活动说明", "优惠", "团购"],
        focus: "清楚说明活动价值、适用条件和限制",
        openingOptions: ["先说活动适合谁", "从最关键的权益切入"],
        fallbackStructure: ["活动权益", "适用人群", "参与方式", "期限与限制"],
        optionalInformation: ["价格", "日期", "库存", "使用条件"],
        avoid: ["制造稀缺感", "隐藏限制条件"]
      }
    ]
  },
  outdoor: {
    categoryName: "户外路线",
    fallback: {
      ...genericFallback,
      focus: "帮助用户完成一个具体路线判断"
    },
    presets: [
      {
        name: "路线日记",
        matchKeywords: ["路线日记", "徒步日记", "路线体验"],
        focus: "帮助用户理解路线体验和适用人群",
        openingOptions: ["先给适合谁、不适合谁的结论", "从最有记忆点的路线节点切入"],
        fallbackStructure: ["适合人群与结论", "关键节点和路况", "最影响体验的因素", "一句选择建议"],
        optionalInformation: ["距离", "爬升", "耗时", "交通", "补给"],
        avoid: ["写成流水账", "机械罗列全部路线信息"]
      },
      {
        name: "关键路况",
        matchKeywords: ["关键路况", "风险路段", "容易迷路", "滑"],
        focus: "帮助用户判断某段路况是否适合自己",
        openingOptions: ["直接给风险结论", "从最容易误判的一段路切入"],
        fallbackStructure: ["风险结论", "具体路段表现", "通过条件", "不适合人群", "规避或撤退建议"],
        optionalInformation: ["天气影响", "鞋具", "技术要求", "撤退点"],
        avoid: ["重复介绍完整路线", "为了点击夸大风险"]
      },
      {
        name: "风景图集",
        matchKeywords: ["风景图集", "风景", "出片", "季节景色"],
        focus: "用真实画面表达路线的景观价值和适配边界",
        openingOptions: ["从最有记忆点的一张图切入", "先说明什么季节或人群更适合"],
        fallbackStructure: ["核心画面", "图集中的景观变化", "季节与体感", "路线适配提醒"],
        optionalInformation: ["季节", "天气", "光线", "拍摄节点"],
        avoid: ["只堆形容词", "用图片暗示不存在的路况"]
      },
      {
        name: "路线攻略",
        matchKeywords: ["路线攻略", "新手攻略", "怎么走", "路线信息"],
        focus: "提供完成路线决策所需的关键信息",
        openingOptions: ["先给路线适配结论", "从用户最关心的一项数据切入"],
        fallbackStructure: ["路线概况", "关键节点", "时间和体力安排", "交通补给与撤退"],
        optionalInformation: ["距离", "爬升", "耗时", "起终点"],
        avoid: ["把未知数据补全", "不分重点地罗列参数"]
      },
      {
        name: "装备复盘",
        matchKeywords: ["装备复盘", "装备", "穿什么", "带什么"],
        focus: "根据真实路线条件判断装备是否有用",
        openingOptions: ["先说最有用或最没用的一件装备", "从一个现场问题切入"],
        fallbackStructure: ["现场问题", "装备表现", "适用条件", "替代选择"],
        optionalInformation: ["天气", "路面", "负重", "季节"],
        avoid: ["写成购物清单", "把个人偏好当通用结论"]
      },
      {
        name: "交通补给",
        matchKeywords: ["交通补给", "停车", "公交", "补水", "厕所"],
        focus: "解决出发、补给和返程中的实际问题",
        openingOptions: ["先回答怎么到达或怎么返程", "从最容易断补给的节点切入"],
        fallbackStructure: ["到达方式", "起终点衔接", "补给与厕所", "返程和撤退"],
        optionalInformation: ["停车", "公交", "补水", "营业时间"],
        avoid: ["重复讲风景", "使用未核验交通信息"]
      },
      {
        name: "安全提醒",
        matchKeywords: ["安全提醒", "风险", "危险", "不建议"],
        focus: "说明一个真实风险的判断方式和停止条件",
        openingOptions: ["直接说明停止条件", "从容易低估的风险切入"],
        fallbackStructure: ["风险场景", "判断依据", "应对方式", "停止或撤退条件"],
        optionalInformation: ["天气", "路况", "体力", "通讯"],
        avoid: ["制造恐慌", "用绝对安全承诺"]
      }
    ]
  },
  museum: {
    categoryName: "展馆研学",
    fallback: {
      ...genericFallback,
      focus: "帮助用户解决一个具体观展或研学问题"
    },
    presets: [
      {
        name: "展览看点",
        matchKeywords: ["展览看点", "值得看", "必看", "展览"],
        focus: "突出一个展览最值得投入时间的内容",
        openingOptions: ["从最值得看的展项切入", "先说明适合哪类观众"],
        fallbackStructure: ["核心看点", "对应展品或展区", "观看方式", "展期核验"],
        optionalInformation: ["展期", "地点", "讲解", "拍摄"],
        avoid: ["把展览公告重新抄一遍", "夸大展品价值"]
      },
      {
        name: "馆藏故事",
        matchKeywords: ["馆藏故事", "展品故事", "文物", "作品"],
        focus: "围绕一件真实展品建立理解和观看兴趣",
        openingOptions: ["从展品细节切入", "先回答它为什么值得停留"],
        fallbackStructure: ["展品识别", "背景与细节", "观看重点", "来源和版权边界"],
        optionalInformation: ["年代", "作者", "来源", "展区"],
        avoid: ["虚构展品故事", "使用未经核验的历史结论"]
      },
      {
        name: "观展动线",
        matchKeywords: ["观展动线", "参观路线", "怎么逛", "路线动线"],
        focus: "帮助用户合理分配参观时间和顺序",
        openingOptions: ["先给时间有限时的取舍方案", "从最容易走回头路的区域切入"],
        fallbackStructure: ["参观条件", "核心顺序", "停留与取舍", "出口或配套"],
        optionalInformation: ["楼层", "时间", "休息区", "讲解"],
        avoid: ["要求每个展区都看", "虚构场馆动线"]
      },
      {
        name: "亲子研学",
        matchKeywords: ["亲子研学", "带孩子", "研学", "儿童"],
        focus: "判断展览是否适合特定年龄和学习目标",
        openingOptions: ["先说明适合年龄", "从孩子最容易参与的环节切入"],
        fallbackStructure: ["年龄与目标", "可参与内容", "家长引导方式", "预约与规则"],
        optionalInformation: ["年龄", "时长", "课程", "费用"],
        avoid: ["把普通参观写成研学课程", "承诺学习效果"]
      },
      {
        name: "预约票务",
        matchKeywords: ["预约票务", "门票", "预约", "开放时间"],
        focus: "解决入馆前的预约、票务和时间问题",
        openingOptions: ["直接回答是否需要预约", "从最容易错过的时间条件切入"],
        fallbackStructure: ["预约结论", "操作步骤", "时间和费用", "入馆限制"],
        optionalInformation: ["证件", "票价", "场次", "闭馆日"],
        avoid: ["混入大量展览介绍", "使用过期规则"]
      },
      {
        name: "观展问答",
        matchKeywords: ["观展问答", "拍照", "能不能", "注意事项"],
        focus: "回答一个影响观展体验的具体问题",
        openingOptions: ["直接回答问题", "先说明不同区域的规则差异"],
        fallbackStructure: ["问题结论", "适用范围", "现场依据", "替代建议"],
        optionalInformation: ["拍摄", "寄存", "儿童", "无障碍"],
        avoid: ["用单一区域规则代表全馆", "虚构服务设施"]
      }
    ]
  },
  product: {
    categoryName: "地域产品与文创",
    fallback: {
      ...genericFallback,
      focus: "帮助用户解决一个具体购买或使用问题"
    },
    presets: [
      {
        name: "产品卖点",
        matchKeywords: ["产品种草", "产品卖点", "值得买", "单品"],
        focus: "说明一个真实产品的核心特点和适用场景",
        openingOptions: ["从最有辨识度的细节切入", "先说明适合谁"],
        fallbackStructure: ["产品记忆点", "真实细节和用途", "适合人群", "规格核验"],
        optionalInformation: ["材质", "规格", "价格", "使用方式"],
        avoid: ["堆砌卖点", "夸大功效"]
      },
      {
        name: "产地故事",
        matchKeywords: ["产地故事", "地域特色", "原产地", "地方特产"],
        focus: "解释产地与产品特点之间可核验的关系",
        openingOptions: ["从一个地域细节切入", "先说明产地带来的具体差异"],
        fallbackStructure: ["产地背景", "原料或环境", "产品差异", "来源核验"],
        optionalInformation: ["地域", "原料", "季节", "产区"],
        avoid: ["把营销故事当历史事实", "伪造原产地"]
      },
      {
        name: "制作工艺",
        matchKeywords: ["制作工艺", "工艺", "怎么做", "制作过程"],
        focus: "用真实工艺解释产品价值",
        openingOptions: ["从关键工序切入", "从成品细节反推制作方式"],
        fallbackStructure: ["成品特点", "关键工序", "工艺影响", "真实性核验"],
        optionalInformation: ["材料", "工序", "耗时", "手工比例"],
        avoid: ["神化工艺", "编造秘方和流程"]
      },
      {
        name: "使用场景",
        matchKeywords: ["使用场景", "怎么用", "搭配", "适合"],
        focus: "展示产品在一个具体场景中的使用价值",
        openingOptions: ["从用户场景切入", "先说明什么情况下最实用"],
        fallbackStructure: ["场景需求", "使用方式", "实际限制", "选择建议"],
        optionalInformation: ["尺寸", "保养", "搭配", "保存"],
        avoid: ["覆盖过多场景", "虚构使用效果"]
      },
      {
        name: "送礼方案",
        matchKeywords: ["送礼", "礼盒", "伴手礼", "礼物"],
        focus: "帮助用户根据对象、预算和场景选择礼物",
        openingOptions: ["先说明适合送谁", "从最难选的送礼场景切入"],
        fallbackStructure: ["送礼对象", "产品与包装", "预算或规格选择", "购买提醒"],
        optionalInformation: ["预算", "包装", "物流", "保质期"],
        avoid: ["泛化所有送礼对象", "虚构库存和物流"]
      },
      {
        name: "购买问答",
        matchKeywords: ["购买问答", "购买指南", "怎么买", "规格价格", "FAQ"],
        focus: "回答一个影响购买决定的具体问题",
        openingOptions: ["直接给选择结论", "从规格差异切入"],
        fallbackStructure: ["问题结论", "规格或版本差异", "适用条件", "购买核验"],
        optionalInformation: ["价格", "规格", "物流", "售后"],
        avoid: ["强行催单", "省略限制条件"]
      }
    ]
  },
  service: {
    categoryName: "本地服务",
    fallback: {
      ...genericFallback,
      focus: "围绕一个真实服务问题建立理解和信任"
    },
    presets: [
      {
        name: "用户问题",
        matchKeywords: ["用户问题", "痛点", "为什么", "顾客问答"],
        focus: "直接回答目标用户最关心的一个问题",
        openingOptions: ["直接给结论", "从一个典型使用场景切入"],
        fallbackStructure: ["问题结论", "原因或判断依据", "适用边界", "下一步建议"],
        optionalInformation: ["时间", "预算", "适用人群", "限制"],
        avoid: ["泛泛介绍全部服务", "制造焦虑"]
      },
      {
        name: "服务项目",
        matchKeywords: ["服务项目", "服务介绍", "项目", "适合谁"],
        focus: "说明一个服务项目解决什么问题以及适合谁",
        openingOptions: ["先说明适合谁", "从服务解决的具体问题切入"],
        fallbackStructure: ["用户需求", "服务内容", "适用人群", "预约和限制"],
        optionalInformation: ["时长", "价格", "地点", "准备事项"],
        avoid: ["堆砌全部服务", "承诺不可保证的结果"]
      },
      {
        name: "服务流程",
        matchKeywords: ["服务流程", "过程", "怎么做", "预约流程"],
        focus: "让用户理解从咨询到完成服务的真实步骤",
        openingOptions: ["从用户最担心的步骤切入", "先给出流程总览"],
        fallbackStructure: ["开始条件", "关键步骤", "用户需要配合的事项", "完成与后续"],
        optionalInformation: ["时长", "材料", "人员", "复查"],
        avoid: ["把流程写成效果承诺", "省略重要风险"]
      },
      {
        name: "授权案例",
        matchKeywords: ["授权案例", "案例过程", "案例", "前后对比"],
        focus: "基于授权事实说明服务过程和适用边界",
        openingOptions: ["从客户问题切入", "从案例中的关键选择切入"],
        fallbackStructure: ["案例背景", "处理过程", "可见结果", "个体差异与授权说明"],
        optionalInformation: ["时间", "预算", "过程", "反馈"],
        avoid: ["虚构客户反馈", "夸张前后对比"]
      },
      {
        name: "门店空间",
        matchKeywords: ["门店空间", "环境", "设备", "到店"],
        focus: "帮助用户判断空间、设备和到店场景是否合适",
        openingOptions: ["从最影响体验的空间细节切入", "先说明适合的到店场景"],
        fallbackStructure: ["空间特点", "设备或功能", "适合人群", "到店信息"],
        optionalInformation: ["交通", "隐私", "设备", "预约"],
        avoid: ["把环境等同于服务效果", "虚构设备资质"]
      },
      {
        name: "价格预约",
        matchKeywords: ["价格预约", "价格套餐", "多少钱", "预约"],
        focus: "清楚说明价格边界、适用条件和预约方式",
        openingOptions: ["先说明价格由什么决定", "从最常见的预算误解切入"],
        fallbackStructure: ["服务范围", "价格影响因素", "适用条件", "预约和核验"],
        optionalInformation: ["价格", "套餐", "档期", "取消"],
        avoid: ["隐藏额外条件", "制造虚假低价"]
      }
    ]
  },
  wedding: {
    categoryName: "婚礼服务",
    fallback: {
      ...genericFallback,
      focus: "围绕一个真实婚礼细节或备婚问题展开"
    },
    presets: [
      {
        name: "婚礼细节",
        matchKeywords: ["婚礼细节", "细节拆解", "蛋糕", "花艺", "仪式区", "迎宾区"],
        focus: "从真实婚礼图片中拆解一个有收藏价值的细节",
        openingOptions: ["从图片中最有记忆点的细节切入", "先说明这个细节适合什么婚礼"],
        fallbackStructure: ["可见细节", "色彩材质或空间关系", "适合风格", "落地提醒"],
        optionalInformation: ["花材", "材质", "色系", "尺寸"],
        avoid: ["一篇拆解多个无关细节", "虚构花材和成本"]
      },
      {
        name: "风格拆解",
        matchKeywords: ["风格拆解", "婚礼风格", "氛围", "配色"],
        focus: "帮助新人判断一种视觉风格是否适合自己",
        openingOptions: ["先给风格判断", "从决定风格的核心元素切入"],
        fallbackStructure: ["风格特征", "关键视觉元素", "适合场地和人群", "落地边界"],
        optionalInformation: ["色彩", "材质", "灯光", "季节"],
        avoid: ["只堆高级感等形容词", "把效果图当真实案例"]
      },
      {
        name: "场地适配",
        matchKeywords: ["场地适配", "场地", "仪式区", "空间"],
        focus: "说明设计方案与真实场地条件如何匹配",
        openingOptions: ["从场地限制切入", "先说明什么空间更适合"],
        fallbackStructure: ["场地条件", "设计选择", "需要取舍的部分", "现场核验"],
        optionalInformation: ["层高", "动线", "光线", "人数"],
        avoid: ["忽略场地限制", "承诺效果完全复刻"]
      },
      {
        name: "预算取舍",
        matchKeywords: ["预算", "成本", "省钱", "价格", "套餐"],
        focus: "帮助新人理解预算应该优先放在哪些细节",
        openingOptions: ["先给预算优先级", "从最容易浪费预算的项目切入"],
        fallbackStructure: ["核心目标", "优先投入项", "可以简化项", "价格与档期核验"],
        optionalInformation: ["预算", "花材", "面积", "人工"],
        avoid: ["给出未经确认的具体报价", "制造预算焦虑"]
      },
      {
        name: "服务流程",
        matchKeywords: ["服务流程", "婚礼策划流程", "怎么沟通", "筹备"],
        focus: "让新人理解从需求沟通到婚礼落地的关键节点",
        openingOptions: ["从最容易返工的环节切入", "先给筹备节点总览"],
        fallbackStructure: ["需求确认", "方案与取舍", "现场执行", "核验和交付"],
        optionalInformation: ["档期", "场地", "人员", "确认节点"],
        avoid: ["写成公司介绍", "承诺绝对省心和零失误"]
      },
      {
        name: "备婚问答",
        matchKeywords: ["备婚问答", "避坑", "新人问题", "怎么选"],
        focus: "回答一个会影响婚礼决策的具体问题",
        openingOptions: ["直接给判断结论", "从新人最常见的误解切入"],
        fallbackStructure: ["问题结论", "判断条件", "案例或图片依据", "沟通和确认建议"],
        optionalInformation: ["预算", "场地", "档期", "风格"],
        avoid: ["制造新人焦虑", "把个案写成普遍结论"]
      }
    ]
  }
};

function matchPreset(
  library: NoteContentStructureLibrary,
  contentType: string,
  topicTitle: string
) {
  const normalizedContentType = contentType.toLowerCase();
  const normalizedTopicTitle = topicTitle.toLowerCase();
  let bestPreset: NoteContentStructurePreset | null = null;
  let bestScore = 0;

  for (const preset of library.presets) {
    const score = preset.matchKeywords.reduce((total, keyword) => {
      const normalizedKeyword = keyword.toLowerCase();
      const contentTypeScore = normalizedContentType.includes(normalizedKeyword)
        ? normalizedKeyword.length * 100
        : 0;
      const topicTitleScore = normalizedTopicTitle.includes(normalizedKeyword)
        ? normalizedKeyword.length
        : 0;
      return total + contentTypeScore + topicTitleScore;
    }, 0);
    if (score > bestScore) {
      bestPreset = preset;
      bestScore = score;
    }
  }

  return bestPreset || library.fallback;
}

function normalizeContentCandidates(value: string) {
  return value
    .replace(/^\s*可选内容要点\s*[:：]?\s*/u, "")
    .split(/(?:\s*(?:->|→|｜|\|)\s*|\n+|[；;])/u)
    .map((item) => item.replace(/^\s*(?:[-*•]|\d+[.、])\s*/u, "").trim())
    .filter(Boolean)
    .map((item) => item.replace(/^(?:开头|接着|然后|最后)\s*/u, "").trim())
    .filter(Boolean);
}

export function resolveNoteContentStructure(input: {
  mode: AccountVisualMode;
  isWedding: boolean;
  contentType: string;
  topicTitle: string;
  bodyStructure?: string | null;
}): ResolvedNoteContentStructure {
  const category: StructureCategory = input.isWedding ? "wedding" : input.mode;
  const library = libraries[category];
  const preset = matchPreset(library, input.contentType, input.topicTitle);
  const taskStructure = String(input.bodyStructure || "").trim();

  return {
    categoryName: library.categoryName,
    archetypeName: preset.name,
    focus: preset.focus,
    contentCandidates: taskStructure ? normalizeContentCandidates(taskStructure) : preset.fallbackStructure,
    structureSource: taskStructure ? "note_task" : "library",
    optionalInformation: preset.optionalInformation,
    avoid: preset.avoid
  };
}
