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
    templates: buildTemplates()
  });
}

export async function POST() {
  return NextResponse.json(
    { error: "当前入口暂不支持创建账号，请回到账号页继续操作。" },
    { status: 410 }
  );
}
