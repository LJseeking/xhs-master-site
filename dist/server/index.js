const templates = [
  {
    "id": 1,
    "typeKey": "cultural_tourism_destination",
    "name": "文旅目的地 / 景区街区",
    "defaultColumns": "[\"目的地种草\",\"一日动线\",\"节庆活动\",\"拍照机位\",\"交通票务\",\"避坑问答\"]",
    "weeklyRatio": "{\"目的地种草\":2,\"动线攻略\":2,\"活动转化\":1,\"服务信息\":1,\"互动问答\":1}"
  },
  {
    "id": 2,
    "typeKey": "folk_custom_heritage",
    "name": "民俗 / 非遗 / 传统文化体验",
    "defaultColumns": "[\"非遗工艺\",\"民俗活动\",\"传承人故事\",\"体验预约\",\"节庆节点\",\"文化问答\"]",
    "weeklyRatio": "{\"工艺故事\":2,\"活动体验\":2,\"预约转化\":1,\"文化科普\":1,\"互动问答\":1}"
  },
  {
    "id": 3,
    "typeKey": "homestay_hotel_camp",
    "name": "民宿 / 酒店 / 露营地",
    "defaultColumns": "[\"房型空间\",\"周边体验\",\"亲子/情侣场景\",\"价格套餐\",\"入住攻略\",\"避坑问答\"]",
    "weeklyRatio": "{\"房型空间\":2,\"周边体验\":2,\"转化信息\":1,\"服务问答\":1,\"互动问答\":1}"
  },
  {
    "id": 4,
    "typeKey": "restaurant",
    "name": "餐饮 / 在地美食",
    "defaultColumns": "[\"招牌菜种草\",\"套餐场景\",\"门店环境\",\"菜单上新\",\"在地风味\",\"顾客问答\"]",
    "weeklyRatio": "{\"招牌菜\":2,\"场景套餐\":2,\"环境氛围\":1,\"上新活动\":1,\"互动问答\":1}"
  },
  {
    "id": 5,
    "typeKey": "hiking_diary",
    "name": "户外路线 / 徒步骑行活动",
    "defaultColumns": "[\"路线日记\",\"路线攻略\",\"装备复盘\",\"风景图集\",\"交通补给\",\"安全提醒\"]",
    "weeklyRatio": "{\"路线日记\":2,\"攻略收藏\":2,\"风景图集\":1,\"装备复盘\":1,\"问答互动\":1}"
  },
  {
    "id": 6,
    "typeKey": "museum_exhibition_study",
    "name": "博物馆 / 展览 / 研学",
    "defaultColumns": "[\"展览看点\",\"亲子研学\",\"路线动线\",\"馆藏故事\",\"预约票务\",\"观展问答\"]",
    "weeklyRatio": "{\"展览看点\":2,\"研学攻略\":2,\"动线信息\":1,\"票务问答\":1,\"互动问答\":1}"
  },
  {
    "id": 7,
    "typeKey": "regional_product_cultural_creative",
    "name": "地域特产 / 文创伴手礼",
    "defaultColumns": "[\"产品种草\",\"产地故事\",\"制作工艺\",\"礼盒场景\",\"购买指南\",\"FAQ 问答\"]",
    "weeklyRatio": "{\"产品种草\":2,\"产地故事\":1,\"工艺细节\":1,\"礼盒转化\":1,\"互动问答\":1}"
  },
  {
    "id": 8,
    "typeKey": "local_life_service",
    "name": "本地生活 / 服务门店",
    "defaultColumns": "[\"服务项目\",\"案例过程\",\"门店空间\",\"价格套餐\",\"预约攻略\",\"顾客问答\"]",
    "weeklyRatio": "{\"服务项目\":2,\"案例过程\":2,\"空间信任\":1,\"价格问答\":1,\"互动问答\":1}"
  }
];

const json = (data, init = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });

const cloudOnlyNotice =
  "这个外网预览版已发布页面与静态资源。本机 SQLite、文件上传和本地目录读写功能需要迁移到云端 D1/R2 后才能在外网完整使用。";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/accounts" && request.method === "GET") {
      return json({ accounts: [], templates, notice: cloudOnlyNotice });
    }

    if (url.pathname === "/api/system-health" && request.method === "GET") {
      return json({
        ok: true,
        mode: "sites-static-preview",
        checks: [
          { label: "页面发布", ok: true, detail: "外网可访问" },
          { label: "本机数据库", ok: false, detail: "外网版本未连接本机 SQLite" },
          { label: "文件目录", ok: false, detail: "外网版本不能访问发布者电脑上的 assets/profiles" },
        ],
        note: cloudOnlyNotice,
      });
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: cloudOnlyNotice }, { status: 501 });
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) return assetResponse;

    const indexUrl = new URL("/", request.url);
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
