import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function extractJsonArray(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const match = trimmed.match(/\[[\s\S]*\]/);
    if (!match) return [];
    try {
      const parsed = JSON.parse(match[0]);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

export async function POST(request: Request, context: { params: { id: string } }) {
  const accountId = Number(context.params.id);
  const body = await request.json();
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });

  const items = extractJsonArray(String(body.rulesJson || ""));
  if (!items.length) return NextResponse.json({ error: "没有识别到 JSON 数组规则。" }, { status: 400 });

  const created = [];
  for (const item of items) {
    if (!item || typeof item !== "object" || !String(item.rule || "").trim()) continue;
    created.push(
      await prisma.expertRule.create({
        data: {
          accountId,
          accountType: String(item.accountType || account.accountType || ""),
          module: String(item.module || "general"),
          rule: String(item.rule || ""),
          positiveExample: String(item.positiveExample || ""),
          negativeExample: String(item.negativeExample || ""),
          reason: String(item.reason || ""),
          source: String(item.source || body.source || "manual"),
          confidence: Number.isFinite(Number(item.confidence)) ? Number(item.confidence) : 0.5,
          applicableWhen: String(item.applicableWhen || ""),
          notApplicableWhen: String(item.notApplicableWhen || ""),
          nextTest: String(item.nextTest || ""),
          status: "候选"
        }
      })
    );
  }

  if (!created.length) return NextResponse.json({ error: "JSON 中没有有效规则。" }, { status: 400 });
  return NextResponse.json({ rules: created });
}
