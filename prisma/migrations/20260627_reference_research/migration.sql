CREATE TABLE IF NOT EXISTS "account_reference_researches" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "searchKeywords" TEXT NOT NULL,
    "commandJson" TEXT NOT NULL,
    "researchPrompt" TEXT NOT NULL,
    "rawResults" TEXT NOT NULL DEFAULT '',
    "selectedAccounts" TEXT NOT NULL DEFAULT '',
    "summaryMarkdown" TEXT NOT NULL DEFAULT '',
    "contentFeatures" TEXT NOT NULL DEFAULT '',
    "personaInsights" TEXT NOT NULL DEFAULT '',
    "strategyInsights" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT '待搜索',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "account_reference_researches_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "account_reference_researches_accountId_idx" ON "account_reference_researches"("accountId");
