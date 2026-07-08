import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = Number(searchParams.get("accountId"));
  const assets = await prisma.asset.findMany({
    where: accountId ? { accountId } : {},
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(assets);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const id = Number(body.id);
  const fields = [
    "sourceType",
    "location",
    "shotAt",
    "tags",
    "suitableTypes",
    "coverReady",
    "used",
    "authorizationState",
    "riskNotes"
  ];
  const data = Object.fromEntries(fields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));
  const asset = await prisma.asset.update({ where: { id }, data });
  return NextResponse.json(asset);
}
