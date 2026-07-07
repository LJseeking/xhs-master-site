CREATE TABLE IF NOT EXISTS "account_image_style_studies" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "accountId" INTEGER NOT NULL,
  "searchKeywords" TEXT NOT NULL,
  "commandJson" TEXT NOT NULL,
  "researchPrompt" TEXT NOT NULL,
  "rawResults" TEXT NOT NULL DEFAULT '',
  "summaryMarkdown" TEXT NOT NULL DEFAULT '',
  "styleBriefJson" TEXT NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT '待搜索',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "account_image_style_studies_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
