import type { Snapshot } from "../domain/models";
import { todayHabits } from "../domain/history";
import { groupTodayHabits } from "../domain/groups";
import { formatDate } from "../domain/dates";

export interface TodayWidgetSnapshot {
  dateLabel: string;
  progress: string;
  rows: string[];
  more: string;
}
export function buildWidgetSnapshot(
  snapshot: Snapshot,
  today: string,
): TodayWidgetSnapshot {
  const scheduled = groupTodayHabits(
    todayHabits(snapshot.habits, snapshot.completions, today),
  ).flatMap((group) => group.habits);
  const done = new Set(
    snapshot.completions.filter((c) => c.date === today).map((c) => c.habitId),
  );
  const completed = scheduled.filter((habit) => done.has(habit.id)).length;
  const ordered = [
    ...scheduled.filter((habit) => !done.has(habit.id)),
    ...scheduled.filter((habit) => done.has(habit.id)),
  ];
  return {
    dateLabel: formatDate(today, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    progress: scheduled.length
      ? `${completed} of ${scheduled.length} complete`
      : "No habits planned",
    rows: ordered
      .slice(0, 3)
      .map(
        (habit) =>
          `${done.has(habit.id) ? "✓" : "☐"} ${habit.emoji} ${habit.name.length > 35 ? habit.name.slice(0, 34) + "…" : habit.name}`,
      ),
    more: scheduled.length > 3 ? `+${scheduled.length - 3} more in Still` : "",
  };
}
