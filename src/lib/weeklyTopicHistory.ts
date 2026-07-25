export type RecentWeeklyTopicGroup = {
  weekStart: string;
  topicTitles: string[];
};

type WeeklyPlanTopicSource = {
  weekStart?: string | Date | null;
  noteTasks?: Array<{ topicTitle?: string | null }> | null;
};

function toDateKey(value: string | Date | null | undefined) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const matched = String(value || "").match(/^\d{4}-\d{2}-\d{2}/);
  return matched?.[0] || "";
}

function toWeekKey(value: string | Date | null | undefined) {
  const dateKey = toDateKey(value);
  if (!dateKey) return "";

  const date = new Date(`${dateKey}T00:00:00Z`);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

export function collectRecentWeeklyTopicGroups(
  plans: WeeklyPlanTopicSource[],
  currentWeekStart: string
): RecentWeeklyTopicGroup[] {
  const currentWeekKey = toWeekKey(currentWeekStart);
  const currentWeekTime = currentWeekKey
    ? Date.parse(`${currentWeekKey}T00:00:00Z`)
    : Number.NaN;
  const oldestWeekKey = Number.isFinite(currentWeekTime)
    ? new Date(currentWeekTime - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : "";
  const groupedTopics = new Map<string, Set<string>>();

  for (const plan of plans) {
    const weekStart = toWeekKey(plan.weekStart);
    if (
      !weekStart
      || (currentWeekKey && weekStart >= currentWeekKey)
      || (oldestWeekKey && weekStart < oldestWeekKey)
    ) {
      continue;
    }

    const topicTitles = (plan.noteTasks || [])
      .map((task) => String(task.topicTitle || "").trim())
      .filter(Boolean);
    if (!topicTitles.length) continue;

    const topics = groupedTopics.get(weekStart) || new Set<string>();
    topicTitles.forEach((title) => topics.add(title));
    groupedTopics.set(weekStart, topics);
  }

  return Array.from(groupedTopics.entries())
    .sort(([left], [right]) => right.localeCompare(left))
    .slice(0, 2)
    .map(([weekStart, topicTitles]) => ({
      weekStart,
      topicTitles: Array.from(topicTitles)
    }));
}
