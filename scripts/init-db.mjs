import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = process.cwd();
const envFile = path.join(root, ".env");
const envLocalFile = path.join(root, ".env.local");
const envContent = existsSync(envFile) ? readFileSync(envFile, "utf8") : "";
const envLocalContent = existsSync(envLocalFile) ? readFileSync(envLocalFile, "utf8") : "";
const databaseUrl =
  process.env.DATABASE_URL ||
  envLocalContent.match(/^DATABASE_URL="?([^"\r\n]+)"?/m)?.[1] ||
  envContent.match(/^DATABASE_URL="?([^"\r\n]+)"?/m)?.[1] ||
  "file:./dev.db";
const sqliteRelativePath = databaseUrl.startsWith("file:") ? databaseUrl.slice("file:".length) : "./dev.db";
const dbPath = path.resolve(path.join(root, "prisma"), sqliteRelativePath);
const migrationDir = path.join(root, "prisma", "migrations", "init");
const migrationFile = path.join(migrationDir, "migration.sql");
const prismaEnv = { ...process.env, DATABASE_URL: databaseUrl };
const migrationsRoot = path.join(root, "prisma", "migrations");
const trackedMigrationTable = "_app_migrations";

function getMigrationDirs() {
  if (!existsSync(migrationsRoot)) {
    return [];
  }

  return readdirSync(migrationsRoot).sort().filter((dir) => dir !== "init");
}

function ensureMigrationTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "${trackedMigrationTable}" (
      "name" TEXT NOT NULL PRIMARY KEY,
      "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function hasRecordedMigration(db, name) {
  const row = db.prepare(`SELECT 1 FROM "${trackedMigrationTable}" WHERE "name" = ? LIMIT 1`).get(name);
  return Boolean(row);
}

function recordMigration(db, name) {
  db.prepare(`INSERT OR IGNORE INTO "${trackedMigrationTable}" ("name") VALUES (?)`).run(name);
}

function splitSqlStatements(sql) {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function isSafeDuplicateError(error) {
  const message = String(error?.message || "");
  return /duplicate column name|already exists/i.test(message);
}

function applyMigrationFile(db, name, file) {
  if (hasRecordedMigration(db, name)) {
    return;
  }

  const sql = readFileSync(file, "utf8");
  const statements = splitSqlStatements(sql);

  for (const statement of statements) {
    try {
      db.exec(statement);
    } catch (error) {
      if (!isSafeDuplicateError(error)) {
        throw error;
      }
    }
  }

  recordMigration(db, name);
}

function markAllCurrentMigrationsApplied(db) {
  for (const dir of getMigrationDirs()) {
    recordMigration(db, dir);
  }
}

mkdirSync(migrationDir, { recursive: true });

if (existsSync(dbPath) && statSync(dbPath).size > 0) {
  console.log(`SQLite database already exists: ${dbPath}`);
  const db = new DatabaseSync(dbPath);
  try {
    ensureMigrationTable(db);

    for (const dir of getMigrationDirs()) {
      const file = path.join(migrationsRoot, dir, "migration.sql");
      if (existsSync(file)) {
        applyMigrationFile(db, dir, file);
      }
    }
  } finally {
    db.close();
  }
  process.exit(0);
}

const sql = execFileSync(
  "npx",
  ["prisma", "migrate", "diff", "--from-empty", "--to-schema-datamodel", "prisma/schema.prisma", "--script"],
  { cwd: root, encoding: "utf8", env: prismaEnv }
);

await import("node:fs").then((fs) => fs.writeFileSync(migrationFile, sql, "utf8"));

execFileSync("npx", ["prisma", "db", "execute", "--file", migrationFile, "--schema", "prisma/schema.prisma"], {
  cwd: root,
  env: prismaEnv,
  stdio: "inherit"
});

const db = new DatabaseSync(dbPath);
try {
  ensureMigrationTable(db);
  markAllCurrentMigrationsApplied(db);
} finally {
  db.close();
}
