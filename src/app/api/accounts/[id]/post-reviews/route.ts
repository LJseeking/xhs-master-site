import { NextResponse } from "next/server";
import { buildPostReviewPrompt } from "@/lib/expertLearning";

export async function POST(request: Request, context: { params: { id: string } }) {
  const body = await request.json();
  const account = body.account && typeof body.account === "object" ? body.account : null;
  const noteTaskSnapshot = body.noteTask && typeof body.noteTask === "object" ? body.noteTask : null;
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });

  const noteTaskId = body.noteTaskId ? Number(body.noteTaskId) : null;
  const resolvedNoteTask = noteTaskSnapshot;
  if (noteTaskId && !resolvedNoteTask) {
    return NextResponse.json({ error: "笔记不属于当前账号" }, { status: 400 });
  }

  const prompt = buildPostReviewPrompt({
    account,
    noteTask: resolvedNoteTask,
    postTitle: body.postTitle || "",
    postUrl: body.postUrl || "",
    publishedAt: body.publishedAt || "",
    metrics: body.metrics || "",
    comments: body.comments || "",
    actualContent: body.actualContent || "",
    expertFeedback: body.expertFeedback || "",
    editComparison: body.editComparison || "",
    subjective: body.subjective || "",
    distillGoal: body.distillGoal || ""
  });

  const review = {
    id: Date.now(),
    accountId: account.id,
    noteTaskId: resolvedNoteTask?.id || null,
    inputJson: JSON.stringify(body, null, 2),
    prompt,
    status: "Prompt 已生成",
    createdAt: new Date().toISOString()
  };

  return NextResponse.json({ review, prompt });
}
