import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const id = Number(context.params.id);
  const body = await request.json();

  if (typeof body.profileContent === "string") {
    const profile = await prisma.accountProfile.findUnique({ where: { accountId: id } });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    const versions = JSON.parse(profile.versions || "[]");
    const nextVersion = profile.version + 1;
    versions.push({ version: nextVersion, savedAt: new Date().toISOString(), content: body.profileContent });
    await fs.writeFile(profile.path, body.profileContent, "utf8");
    await prisma.accountProfile.update({
      where: { accountId: id },
      data: { content: body.profileContent, version: nextVersion, versions: JSON.stringify(versions) }
    });
  }

  const accountFields = [
    "name",
    "accountParam",
    "stage",
    "personaBase",
    "city",
    "targetUsers",
    "painPoints",
    "contentDirections",
    "businessGoals",
    "monetization",
    "referenceAccounts",
    "materialCondition",
    "taboos"
  ];
  const data = Object.fromEntries(accountFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));
  if (Object.keys(data).length) {
    await prisma.account.update({ where: { id }, data });
  }

  const account = await prisma.account.findUnique({
    where: { id },
    include: {
      strategy: true,
      profile: true,
      referenceResearches: { orderBy: { createdAt: "desc" }, take: 5 },
      imageStyleStudies: { orderBy: { createdAt: "desc" }, take: 5 },
      interactionPlans: { orderBy: { createdAt: "desc" }, take: 8 },
      postReviews: { orderBy: { createdAt: "desc" }, take: 8 },
      expertRules: { orderBy: { createdAt: "desc" }, take: 20 },
      industryKnowledgeResearches: { orderBy: { createdAt: "desc" }, take: 5 },
      assets: { orderBy: { createdAt: "desc" } },
      weeklyPlans: { orderBy: { createdAt: "desc" }, include: { noteTasks: true } }
    }
  });

  return NextResponse.json(account);
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  const id = Number(context.params.id);
  const account = await prisma.account.findUnique({ where: { id } });
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });

  await prisma.account.delete({ where: { id } });

  const nextAccount = await prisma.account.findFirst({ orderBy: { updatedAt: "desc" }, select: { id: true } });

  return NextResponse.json({
    ok: true,
    deletedId: id,
    nextAccountId: nextAccount?.id ?? null,
    note: "已删除数据库中的账号及关联记录；本地 profiles/assets 文件未物理删除。"
  });
}
