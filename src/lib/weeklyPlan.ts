export type WeeklyTaskMediaType = "image_text" | "video_text";

export function clampWeeklyFrequency(value: unknown, fallback = 5) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  const safeFallback = Math.max(1, Math.min(Number.isFinite(fallback) ? Math.round(fallback) : 5, 7));
  return Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 7)) : safeFallback;
}

export function normalizeWeeklyRatio(value: string, frequency: number) {
  const weights = new Map<string, number>();
  for (const rawItem of value.split("/")) {
    const item = rawItem.trim();
    if (!item) continue;
    const match = item.match(/^(.*?)(\d+)$/);
    const label = (match?.[1] || item).trim();
    const weight = Math.max(1, Number(match?.[2] || 1));
    if (label) weights.set(label, (weights.get(label) || 0) + weight);
  }

  const entries = Array.from(weights, ([label, weight], index) => ({ label, weight, index }));
  if (!entries.length) return "";
  const target = clampWeeklyFrequency(frequency);
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  const allocations = entries.map((entry) => {
    const exact = (entry.weight / totalWeight) * target;
    return { ...entry, count: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let remaining = target - allocations.reduce((sum, entry) => sum + entry.count, 0);

  for (const entry of [...allocations].sort((a, b) => b.remainder - a.remainder || b.weight - a.weight || a.index - b.index)) {
    if (remaining <= 0) break;
    entry.count += 1;
    remaining -= 1;
  }

  return allocations
    .filter((entry) => entry.count > 0)
    .map((entry) => `${entry.label}${entry.count}`)
    .join(" / ");
}

function contentCategory(value: string) {
  return value
    .replace(/^\s*(?:图文笔记|视频脚本|视频笔记)\s*(?:[-—|｜:：/]\s*)?/u, "")
    .trim() || "主题内容";
}

export function normalizeWeeklyTaskMedia<T extends { type?: string; contentType?: string }>(
  tasks: T[],
  requestedVideoCount: number
): Array<T & { type: WeeklyTaskMediaType; contentType: string }> {
  const videoCount = Math.max(0, Math.min(Math.trunc(requestedVideoCount || 0), tasks.length));
  const preferredVideoIndexes = tasks
    .map((task, index) => ({
      index,
      preferred: task.type === "video_text" || /视频/u.test(String(task.contentType || ""))
    }))
    .filter((item) => item.preferred)
    .map((item) => item.index);

  const videoIndexes = new Set(preferredVideoIndexes.slice(0, videoCount));
  for (let index = 0; index < tasks.length && videoIndexes.size < videoCount; index += 1) {
    videoIndexes.add(index);
  }

  return tasks.map((task, index) => {
    const type: WeeklyTaskMediaType = videoIndexes.has(index) ? "video_text" : "image_text";
    return {
      ...task,
      type,
      contentType: `${type === "video_text" ? "视频脚本" : "图文笔记"}-${contentCategory(String(task.contentType || ""))}`
    };
  });
}
