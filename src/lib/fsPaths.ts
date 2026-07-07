import fs from "node:fs/promises";
import path from "node:path";

export const workspaceRoot = process.cwd();

export function slugifyAccountName(name: string) {
  return name
    .trim()
    .replace(/[\\/:*?"<>|#%{}^~[\]`]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export function profileDirFor(name: string) {
  return path.join(workspaceRoot, "profiles", slugifyAccountName(name));
}

export function agentsPathFor(name: string) {
  return path.join(profileDirFor(name), "AGENTS.md");
}

export function assetsDirFor(name: string) {
  return path.join(workspaceRoot, "assets", slugifyAccountName(name));
}

export function publicPathForAbsolute(filePath: string) {
  const rel = path.relative(workspaceRoot, filePath).split(path.sep).join("/");
  return `/${rel}`;
}

export async function ensureAccountDirs(name: string) {
  const profileDir = profileDirFor(name);
  const assetsDir = assetsDirFor(name);
  await fs.mkdir(profileDir, { recursive: true });
  await fs.mkdir(assetsDir, { recursive: true });
  return {
    profilePath: agentsPathFor(name),
    assetsPath: assetsDir
  };
}
