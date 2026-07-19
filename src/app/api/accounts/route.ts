import { NextResponse } from "next/server";
import { accountTypeTemplates } from "@/data/accountTypeTemplates";

function buildTemplates() {
  return accountTypeTemplates.map((template, index) => ({
    id: index + 1,
    typeKey: template.typeKey,
    name: template.name,
    defaultColumns: JSON.stringify(template.defaultColumns),
    weeklyRatio: JSON.stringify(template.weeklyRatio),
    imageStrategy: JSON.stringify(template.imageStrategy),
    titleStrategy: JSON.stringify(template.titleStrategy),
    coverStrategy: JSON.stringify(template.coverStrategy),
    interactionStrategy: JSON.stringify(template.interactionStrategy),
    commercializationPath: JSON.stringify(template.commercializationPath),
    riskRules: JSON.stringify(template.riskRules),
    promptRules: JSON.stringify(template.promptRules)
  }));
}

export async function GET() {
  return NextResponse.json({
    accounts: [],
    templates: buildTemplates(),
    note: "本地 SQLite/Prisma 账号列表已移除；请直接使用后端账号接口与浏览器缓存。"
  });
}

export async function POST() {
  return NextResponse.json(
    { error: "本地账号创建接口已移除，请直接使用后端账号创建流程。" },
    { status: 410 }
  );
}
