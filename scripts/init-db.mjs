import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

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

mkdirSync(migrationDir, { recursive: true });

if (existsSync(dbPath) && statSync(dbPath).size > 0) {
  console.log(`SQLite database already exists: ${dbPath}`);
  const migrationsRoot = path.join(root, "prisma", "migrations");
  if (existsSync(migrationsRoot)) {
    for (const dir of readdirSync(migrationsRoot).sort()) {
      if (dir === "init") continue;
      const file = path.join(migrationsRoot, dir, "migration.sql");
      if (existsSync(file)) {
        execFileSync("npx", ["prisma", "db", "execute", "--file", file, "--schema", "prisma/schema.prisma"], {
          cwd: root,
          env: prismaEnv,
          stdio: "inherit"
        });
      }
    }
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
