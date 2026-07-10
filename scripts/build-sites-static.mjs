import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { accountTypeTemplates } from "../src/data/accountTypeTemplates.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const serverDir = path.join(dist, "server");

async function copyIfExists(from, to) {
  try {
    await fs.access(from);
  } catch {
    return;
  }
  await fs.cp(from, to, { recursive: true });
}

const templates = accountTypeTemplates.map((template, index) => ({
  id: index + 1,
  typeKey: template.typeKey,
  name: template.name,
  defaultColumns: JSON.stringify(template.defaultColumns),
  weeklyRatio: JSON.stringify(template.weeklyRatio),
}));

const worker = `const templates = ${JSON.stringify(templates, null, 2)};

const json = (data, init = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });

const cloudOnlyNotice =
  "这个外网预览版已发布页面与静态资源。本机 SQLite、文件上传和本地目录读写功能需要迁移到云端 D1/R2 后才能在外网完整使用。";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/accounts" && request.method === "GET") {
      return json({ accounts: [], templates, notice: cloudOnlyNotice });
    }

    if (url.pathname === "/api/system-health" && request.method === "GET") {
      return json({
        ok: true,
        mode: "sites-static-preview",
        checks: [
          { label: "页面发布", ok: true, detail: "外网可访问" },
          { label: "本机数据库", ok: false, detail: "外网版本未连接本机 SQLite" },
          { label: "文件目录", ok: false, detail: "外网版本不能访问发布者电脑上的 assets/profiles" },
        ],
        note: cloudOnlyNotice,
      });
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: cloudOnlyNotice }, { status: 501 });
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) return assetResponse;

    const indexUrl = new URL("/", request.url);
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
`;

await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(serverDir, { recursive: true });

await copyIfExists(path.join(root, ".next", "static"), path.join(dist, "_next", "static"));
await copyIfExists(path.join(root, "public"), dist);
await fs.copyFile(path.join(root, ".next", "server", "app", "index.html"), path.join(dist, "index.html"));
await fs.writeFile(path.join(serverDir, "index.js"), worker, "utf8");

console.log("Sites static worker written to dist/server/index.js");
