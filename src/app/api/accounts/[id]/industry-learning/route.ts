import { NextResponse } from "next/server";
import { getTemplateByKey } from "@/data/accountTypeTemplates";
import {
  buildIndustryLearningCommands,
  buildIndustryLearningPrompt
} from "@/lib/expertLearning";

export async function POST(request: Request, context: { params: { id: string } }) {
  const body = await request.json();
  const action = body.action || "prepare";
  const account = body.account && typeof body.account === "object" ? body.account : null;
  if (!account) return NextResponse.json({ error: "账号不存在" }, { status: 404 });

  const templateSeed = getTemplateByKey(account.accountType);
  const template = {
    id: 0,
    typeKey: templateSeed.typeKey,
    name: templateSeed.name,
    defaultColumns: JSON.stringify(templateSeed.defaultColumns),
    weeklyRatio: JSON.stringify(templateSeed.weeklyRatio),
    imageStrategy: JSON.stringify(templateSeed.imageStrategy),
    titleStrategy: JSON.stringify(templateSeed.titleStrategy),
    coverStrategy: JSON.stringify(templateSeed.coverStrategy),
    interactionStrategy: JSON.stringify(templateSeed.interactionStrategy),
    commercializationPath: JSON.stringify(templateSeed.commercializationPath),
    riskRules: JSON.stringify(templateSeed.riskRules),
    promptRules: JSON.stringify(templateSeed.promptRules),
    createdAt: new Date(0),
    updatedAt: new Date(0)
  };
  const topic = String(body.topic || "小红书图文爆款方法、标题封面、图片真实感、评论转化和复盘方法");
  const searchScope = String(body.searchScope || "全国 / 全网优先，本地只作为补充");

  if (action === "prepare") {
    const commands = buildIndustryLearningCommands(account, template, topic);
    const researchPrompt = buildIndustryLearningPrompt({ account, template, topic, searchScope });
    const research = {
      id: Number(body.researchId) || Date.now(),
      accountId: account.id,
      topic,
      searchScope,
      commandJson: JSON.stringify(commands, null, 2),
      researchPrompt,
      rawResults: "",
      summaryMarkdown: "",
      status: "待搜索"
    };
    return NextResponse.json({ research, commands, researchPrompt });
  }

  if (action === "save-results") {
    const rawResults = String(body.rawResults || "");
    const summaryMarkdown = String(body.summaryMarkdown || "");
    if (!rawResults.trim() && !summaryMarkdown.trim()) {
      return NextResponse.json({ error: "请先粘贴行业学习材料或总结。" }, { status: 400 });
    }

    const saved = {
      id: Number(body.researchId) || Date.now(),
      accountId: account.id,
      topic,
      searchScope,
      commandJson: JSON.stringify(buildIndustryLearningCommands(account, template, topic), null, 2),
      researchPrompt: buildIndustryLearningPrompt({ account, template, topic, searchScope }),
      rawResults,
      summaryMarkdown,
      status: "已保存"
    };

    return NextResponse.json({ research: saved });
  }

  return NextResponse.json({ error: "未知 action" }, { status: 400 });
}
