import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const noteTaskId = Number(body.noteTaskId);
  if (!noteTaskId) return NextResponse.json({ error: "任务不存在" }, { status: 404 });

  const draft = {
    id: Date.now(),
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
    rawResult: body.rawResult || "",
    status: "已保存草稿"
  };
  return NextResponse.json(draft);
}
