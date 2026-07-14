CREATE TABLE "post_reviews" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "noteTaskId" INTEGER,
    "inputJson" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '待复盘',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "post_reviews_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "post_reviews_noteTaskId_fkey" FOREIGN KEY ("noteTaskId") REFERENCES "note_tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "expert_rules" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER,
    "accountType" TEXT NOT NULL DEFAULT '',
    "module" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "positiveExample" TEXT NOT NULL DEFAULT '',
    "negativeExample" TEXT NOT NULL DEFAULT '',
    "reason" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT '',
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "applicableWhen" TEXT NOT NULL DEFAULT '',
    "notApplicableWhen" TEXT NOT NULL DEFAULT '',
    "nextTest" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT '候选',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "expert_rules_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "industry_knowledge_researches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "searchScope" TEXT NOT NULL DEFAULT '全国 / 全网',
    "commandJson" TEXT NOT NULL,
    "researchPrompt" TEXT NOT NULL,
    "rawResults" TEXT NOT NULL DEFAULT '',
    "summaryMarkdown" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT '待搜索',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "industry_knowledge_researches_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
