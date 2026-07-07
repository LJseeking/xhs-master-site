CREATE TABLE IF NOT EXISTS "account_interaction_plans" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "accountId" INTEGER NOT NULL,
  "noteTaskId" INTEGER,
  "searchKeywords" TEXT NOT NULL,
  "commandJson" TEXT NOT NULL,
  "discoveryPrompt" TEXT NOT NULL,
  "commentPrompt" TEXT NOT NULL,
  "rawResults" TEXT NOT NULL DEFAULT '',
  "targetUsersMarkdown" TEXT NOT NULL DEFAULT '',
  "commentDraftsMarkdown" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT '待搜索',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "account_interaction_plans_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "account_interaction_plans_noteTaskId_fkey" FOREIGN KEY ("noteTaskId") REFERENCES "note_tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
