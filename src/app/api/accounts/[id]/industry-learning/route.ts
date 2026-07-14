import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeAccountTypeKey } from "@/data/accountTypeTemplates";
import {
  buildIndustryLearningCommands,
  buildIndustryLearningPrompt
} from "@/lib/expertLearning";

export async function POST(request: Request, context: { params: { id: string } }) {
  const accountId = Number(context.params.id);
  const body = await request.json();
  const action = body.action || "prepare";
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });

  const template = await prisma.accountTypeTemplate.findUnique({ where: { typeKey: normalizeAccountTypeKey(account.accountType) } });
  const topic = String(body.topic || "小红书图文爆款方法、标题封面、图片真实感、评论转化和复盘方法");
  const searchScope = String(body.searchScope || "全国 / 全网优先，本地只作为补充");

  if (action === "prepare") {
    const commands = buildIndustryLearningCommands(account, template, topic);
    const researchPrompt = buildIndustryLearningPrompt({ account, template, topic, searchScope });
    const research = await prisma.industryKnowledgeResearch.create({
      data: {
        accountId,
        topic,
        searchScope,
        commandJson: JSON.stringify(commands, null, 2),
        researchPrompt,
        status: "待搜索"
      }
    });
    return NextResponse.json({ research, commands, researchPrompt });
  }

  if (action === "save-results") {
    const rawResults = String(body.rawResults || "");
    const summaryMarkdown = String(body.summaryMarkdown || "");
    if (!rawResults.trim() && !summaryMarkdown.trim()) {
      return NextResponse.json({ error: "请先粘贴行业学习材料或总结。" }, { status: 400 });
    }

    const latestResearch =
      body.researchId
        ? await prisma.industryKnowledgeResearch.findUnique({ where: { id: Number(body.researchId) } })
        : await prisma.industryKnowledgeResearch.findFirst({ where: { accountId }, orderBy: { createdAt: "desc" } });

    const research =
      latestResearch ||
      (await prisma.industryKnowledgeResearch.create({
        data: {
          accountId,
          topic,
          searchScope,
          commandJson: JSON.stringify(buildIndustryLearningCommands(account, template, topic), null, 2),
          researchPrompt: buildIndustryLearningPrompt({ account, template, topic, searchScope }),
          status: "待保存"
        }
      }));

    const saved = await prisma.industryKnowledgeResearch.update({
      where: { id: research.id },
      data: {
        rawResults,
        summaryMarkdown,
        status: "已保存"
      }
    });

    return NextResponse.json({ research: saved });
  }

  return NextResponse.json({ error: "未知 action" }, { status: 400 });
}
