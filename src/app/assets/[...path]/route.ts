import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const contentTypes: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm"
};

export async function GET(_request: Request, context: { params: { path: string[] } }) {
  const safePath = context.params.path.join(path.sep).replace(/\.\./g, "");
  const filePath = path.join(process.cwd(), "assets", safePath);
  try {
    const file = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return new NextResponse(file, {
      headers: {
        "content-type": contentTypes[ext] || "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return NextResponse.json({ error: "file not found" }, { status: 404 });
  }
}
