import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAccountDirs } from "@/lib/fsPaths";
import { accountTypeTemplates, normalizeAccountTypeKey } from "@/data/accountTypeTemplates";
import { getBackendApiBaseUrl } from "@/lib/backendApi";

const API_BASE_URL = getBackendApiBaseUrl();

type BackendResponse<T> = {
  status?: boolean;
  data?: T;
  message?: string;
  code?: string;
};

type BackendAccountListItem = {
  id: number;
  name: string;
  accountParam: string;
  accountType: string;
  stage: string;
  personaBase: string;
  city: string;
  status: string;
  createdAt: string;
};

type BackendAccountListResponse = {
  accounts?: BackendAccountListItem[];
};

type BackendAccountDetail = {
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
  status: string;
  createdAt: string;
  updatedAt: string;
};

function readRequiredHeader(request: Request, name: string) {
  return request.headers.get(name) || request.headers.get(name.toLowerCase()) || "";
}

function inferAccountType(input: { accountType?: string; name?: string; personaBase?: string; contentDirections?: string }) {
  const direct = (input.accountType || "").trim();
  if (direct) {
    const normalized = normalizeAccountTypeKey(direct);
    if (accountTypeTemplates.some((template) => template.typeKey === normalized)) {
      return normalized;
    }
  }

  const hint = [input.accountType || "", input.name || "", input.personaBase || "", input.contentDirections || ""]
    .join(" ")
    .toLowerCase();

  if (/(婚礼|婚庆|备婚)/.test(hint)) return "wedding_planning";
  if (/(餐|美食|火锅|烧烤|咖啡|烘焙)/.test(hint)) return "restaurant";
  if (/(民宿|酒店|露营)/.test(hint)) return "homestay_hotel_camp";
  if (/(徒步|骑行|户外|登山)/.test(hint)) return "hiking_diary";
  if (/(博物馆|展览|研学|馆藏)/.test(hint)) return "museum_exhibition_study";
  if (/(文旅|景区|旅游|目的地)/.test(hint)) return "cultural_tourism_destination";
  if (/(非遗|民俗|传统文化)/.test(hint)) return "folk_custom_heritage";
  if (/(文创|特产|伴手礼|礼盒)/.test(hint)) return "regional_product_cultural_creative";
  return "local_life_service";
}

function buildImportedAccount(record: BackendAccountDetail) {
  const name = record.name?.trim() || `后端账号-${record.id}`;
  const accountParam = record.accountParam?.trim() || String(record.id);
  return {
    name,
    accountParam,
    accountType: inferAccountType(record),
    stage: record.stage?.trim() || "同步导入",
    personaBase: record.personaBase?.trim() || "",
    city: record.city?.trim() || "",
    targetUsers: record.targetUsers?.trim() || "",
    painPoints: record.painPoints?.trim() || "",
    contentDirections: record.contentDirections?.trim() || "",
    businessGoals: record.businessGoals?.trim() || "",
    monetization: record.monetization?.trim() || "",
    referenceAccounts: record.referenceAccounts?.trim() || "",
    materialCondition: record.materialCondition?.trim() || "后端登录后自动同步导入",
    taboos: record.taboos?.trim() || ""
  };
}

async function buildUniqueName(baseName: string) {
  let candidate = baseName;
  let index = 2;
  while (await prisma.account.findUnique({ where: { name: candidate } })) {
    candidate = `${baseName}-${index}`;
    index += 1;
  }
  return candidate;
}

export async function POST(request: Request) {
  try {
    const xhsSign = readRequiredHeader(request, "Xhs-Sign");
    const xhsPerson = readRequiredHeader(request, "Xhs-Person");
    const xhsTime = readRequiredHeader(request, "Xhs-Time");
    const xhsRequestId = readRequiredHeader(request, "Xhs-Request-Id");
    const xhsTest = readRequiredHeader(request, "Xhs-Test") || "1";

    if (!xhsSign || !xhsPerson || !xhsTime || !xhsRequestId) {
      return NextResponse.json({ ok: false, error: "登录信息缺失，请重新登录后再同步账号。" }, { status: 400 });
    }

    const headers = {
      "content-type": "application/json",
      "xhs-language": "zh-cn",
      "xhs-sign": xhsSign,
      "xhs-person": xhsPerson,
      "xhs-time": xhsTime,
      "xhs-request-id": xhsRequestId,
      "xhs-test": xhsTest
    };

    const backendRes = await fetch(`${API_BASE_URL}/account/v1/list`, {
      method: "GET",
      headers,
      cache: "no-store"
    });

    const backendData = (await backendRes.json().catch(() => ({}))) as BackendResponse<BackendAccountListResponse>;
    if (!backendRes.ok || backendData.status === false) {
      return NextResponse.json(
        { ok: false, error: backendData.message || "后端账号列表拉取失败。" },
        { status: backendRes.status || 500 }
      );
    }

    const accounts = backendData.data?.accounts || [];
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of accounts) {
      const detailRes = await fetch(`${API_BASE_URL}/account/v1/detail/${item.id}`, {
        method: "GET",
        headers,
        cache: "no-store"
      });
      const detailData = (await detailRes.json().catch(() => ({}))) as BackendResponse<BackendAccountDetail>;
      if (!detailRes.ok || detailData.status === false || !detailData.data) {
        skipped += 1;
        continue;
      }

      const imported = buildImportedAccount(detailData.data);
      const existing =
        (imported.accountParam
          ? await prisma.account.findFirst({ where: { accountParam: imported.accountParam } })
          : null) ||
        (imported.name ? await prisma.account.findUnique({ where: { name: imported.name } }) : null);

      if (existing) {
        const canRename = !imported.name || imported.name === existing.name
          ? existing.name
          : (await prisma.account.findUnique({ where: { name: imported.name } }))?.id === existing.id
            ? imported.name
            : existing.name;
        await prisma.account.update({
          where: { id: existing.id },
          data: {
            name: canRename,
            accountParam: imported.accountParam || existing.accountParam,
            accountType: imported.accountType || existing.accountType,
            stage: imported.stage || existing.stage,
            personaBase: imported.personaBase,
            city: imported.city,
            targetUsers: imported.targetUsers,
            painPoints: imported.painPoints,
            contentDirections: imported.contentDirections,
            businessGoals: imported.businessGoals,
            monetization: imported.monetization,
            referenceAccounts: imported.referenceAccounts,
            materialCondition: imported.materialCondition,
            taboos: imported.taboos
          }
        });
        updated += 1;
        continue;
      }

      if (!imported.name || !imported.accountParam) {
        skipped += 1;
        continue;
      }

      const uniqueName = await buildUniqueName(imported.name);
      const dirs = await ensureAccountDirs(uniqueName);
      await prisma.account.create({
        data: {
          ...imported,
          name: uniqueName,
          profilePath: dirs.profilePath,
          assetsPath: dirs.assetsPath
        }
      });
      created += 1;
    }

    return NextResponse.json({
      ok: true,
      synced: created + updated,
      created,
      updated,
      skipped,
      totalFromBackend: accounts.length
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "同步失败。" },
      { status: 500 }
    );
  }
}
