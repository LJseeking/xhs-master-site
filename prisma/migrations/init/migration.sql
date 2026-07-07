-- CreateTable
CREATE TABLE "accounts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "accountParam" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "personaBase" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "targetUsers" TEXT NOT NULL DEFAULT '',
    "painPoints" TEXT NOT NULL DEFAULT '',
    "contentDirections" TEXT NOT NULL DEFAULT '',
    "businessGoals" TEXT NOT NULL DEFAULT '',
    "monetization" TEXT NOT NULL DEFAULT '',
    "referenceAccounts" TEXT NOT NULL DEFAULT '',
    "materialCondition" TEXT NOT NULL DEFAULT '',
    "taboos" TEXT NOT NULL DEFAULT '',
    "profilePath" TEXT NOT NULL,
    "assetsPath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "account_type_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "typeKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultColumns" TEXT NOT NULL,
    "weeklyRatio" TEXT NOT NULL,
    "imageStrategy" TEXT NOT NULL,
    "titleStrategy" TEXT NOT NULL,
    "coverStrategy" TEXT NOT NULL,
    "interactionStrategy" TEXT NOT NULL,
    "commercializationPath" TEXT NOT NULL,
    "riskRules" TEXT NOT NULL,
    "promptRules" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "account_strategies" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "positioning" TEXT NOT NULL,
    "strategyJson" TEXT NOT NULL,
    "markdown" TEXT NOT NULL,
    "agentsMdContent" TEXT NOT NULL,
    "execGuide" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "account_strategies_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "account_profiles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "versions" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "account_profiles_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "shotAt" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '',
    "suitableTypes" TEXT NOT NULL DEFAULT '',
    "coverReady" BOOLEAN NOT NULL DEFAULT false,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "authorizationState" TEXT NOT NULL DEFAULT '待确认',
    "riskNotes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assets_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "weekly_plans" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "weekStart" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL,
    "ratio" TEXT NOT NULL,
    "testHypothesis" TEXT NOT NULL,
    "commercializationMove" TEXT NOT NULL,
    "interactionGoal" TEXT NOT NULL,
    "availableAssets" TEXT NOT NULL,
    "taboos" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "weekly_plans_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "note_tasks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "weeklyPlanId" INTEGER NOT NULL,
    "publishAt" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentGoal" TEXT NOT NULL,
    "topicTitle" TEXT NOT NULL,
    "targetUser" TEXT NOT NULL,
    "painPoint" TEXT NOT NULL,
    "coreView" TEXT NOT NULL,
    "bodyStructure" TEXT NOT NULL,
    "requiredImages" TEXT NOT NULL,
    "recommendedAssets" TEXT NOT NULL,
    "coverCopyDirection" TEXT NOT NULL,
    "commentHook" TEXT NOT NULL,
    "expectedGoal" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '待生成Prompt',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "note_tasks_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "note_tasks_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "weekly_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "generated_prompts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "noteTaskId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'prompt_command_only',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "generated_prompts_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "generated_prompts_noteTaskId_fkey" FOREIGN KEY ("noteTaskId") REFERENCES "note_tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "command_suggestions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "noteTaskId" INTEGER,
    "category" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "safetyNote" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "command_suggestions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "command_suggestions_noteTaskId_fkey" FOREIGN KEY ("noteTaskId") REFERENCES "note_tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "draft_results" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "noteTaskId" INTEGER NOT NULL,
    "titleCandidates" TEXT NOT NULL DEFAULT '',
    "finalTitle" TEXT NOT NULL DEFAULT '',
    "coverCopyCandidates" TEXT NOT NULL DEFAULT '',
    "finalCoverCopy" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "imageOrderAdvice" TEXT NOT NULL DEFAULT '',
    "imageCaptions" TEXT NOT NULL DEFAULT '',
    "tags" TEXT NOT NULL DEFAULT '',
    "commentGuide" TEXT NOT NULL DEFAULT '',
    "publishAdvice" TEXT NOT NULL DEFAULT '',
    "publishStatus" TEXT NOT NULL DEFAULT '未发布',
    "rawResult" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "draft_results_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "draft_results_noteTaskId_fkey" FOREIGN KEY ("noteTaskId") REFERENCES "note_tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "weekly_reports" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "weeklyPlanId" INTEGER,
    "inputJson" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "weekly_reports_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "weekly_reports_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "weekly_plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "meta" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "system_logs_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_name_key" ON "accounts"("name");

-- CreateIndex
CREATE UNIQUE INDEX "account_type_templates_typeKey_key" ON "account_type_templates"("typeKey");

-- CreateIndex
CREATE UNIQUE INDEX "account_strategies_accountId_key" ON "account_strategies"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "account_profiles_accountId_key" ON "account_profiles"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "draft_results_noteTaskId_key" ON "draft_results"("noteTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

