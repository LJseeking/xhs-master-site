import fs from "node:fs/promises";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const id = Number(context.params.id);
  const body = await request.json().catch(() => ({}));

  if (typeof body.profileContent === "string" && body.profilePath) {
    await fs.writeFile(String(body.profilePath), body.profileContent, "utf8").catch(() => null);
  }

  return NextResponse.json({
    id,
    ...body
  });
}

export async function DELETE(_request: Request, context: { params: { id: string } }) {
  const id = Number(context.params.id);
  return NextResponse.json({
    ok: true,
    deletedId: id,
    nextAccountId: null
  });
}
