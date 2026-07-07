import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const noteTaskId = Number(body.noteTaskId);
  const noteTask = await prisma.noteTask.findUnique({ where: { id: noteTaskId } });
  if (!noteTask) return NextResponse.json({ error: "任务不存在" }, { status: 404 });

  const draft = await prisma.draftResult.upsert({
    where: { noteTaskId },
    update: {
      titleCandidates: body.titleCandidates || "",
      finalTitle: body.finalTitle || "",
      coverCopyCandidates: body.coverCopyCandidates || "",
      finalCoverCopy: body.finalCoverCopy || "",
      body: body.body || "",
      imageOrderAdvice: body.imageOrderAdvice || "",
      imageCaptions: body.imageCaptions || "",
      tags: body.tags || "",
      commentGuide: body.commentGuide || "",
      publishAdvice: body.publishAdvice || "",
      publishStatus: body.publishStatus || "未发布",
      rawResult: body.rawResult || ""
    },
    create: {
      accountId: noteTask.accountId,
      noteTaskId,
      titleCandidates: body.titleCandidates || "",
      finalTitle: body.finalTitle || "",
      coverCopyCandidates: body.coverCopyCandidates || "",
      finalCoverCopy: body.finalCoverCopy || "",
      body: body.body || "",
      imageOrderAdvice: body.imageOrderAdvice || "",
      imageCaptions: body.imageCaptions || "",
      tags: body.tags || "",
      commentGuide: body.commentGuide || "",
      publishAdvice: body.publishAdvice || "",
      publishStatus: body.publishStatus || "未发布",
      rawResult: body.rawResult || ""
    }
  });
  await prisma.noteTask.update({ where: { id: noteTaskId }, data: { status: "已保存草稿" } });
  return NextResponse.json(draft);
}
