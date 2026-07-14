import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPostReviewPrompt } from "@/lib/expertLearning";

export async function POST(request: Request, context: { params: { id: string } }) {
  const accountId = Number(context.params.id);
  const body = await request.json();
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });

  const noteTaskId = body.noteTaskId ? Number(body.noteTaskId) : null;
  const noteTask = noteTaskId ? await prisma.noteTask.findUnique({ where: { id: noteTaskId } }) : null;
  if (noteTaskId && (!noteTask || noteTask.accountId !== accountId)) {
    return NextResponse.json({ error: "笔记不属于当前账号" }, { status: 400 });
  }

  const prompt = buildPostReviewPrompt({
    account,
    noteTask,
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

  const review = await prisma.postReview.create({
    data: {
      accountId,
      noteTaskId,
      inputJson: JSON.stringify(body, null, 2),
      prompt,
      status: "Prompt 已生成"
    }
  });

  return NextResponse.json({ review, prompt });
}
