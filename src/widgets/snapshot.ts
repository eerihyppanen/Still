import type { Snapshot } from "../domain/models";
import { todayHabits } from "../domain/history";
import { groupTodayHabits } from "../domain/groups";
import { formatDate } from "../domain/dates";
import { isWeeklyGoalMet, scheduleOn, weeklyGoalProgress } from "../domain/habits";

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
  const weekly = new Map(scheduled
    .filter((habit) => scheduleOn(habit, today)?.weeklyTarget !== undefined)
    .map((habit) => [habit.id, weeklyGoalProgress(habit, snapshot.completions, today)]));
  const daily = scheduled.filter((habit) => !weekly.has(habit.id));
  const completed = daily.filter((habit) => done.has(habit.id)).length;
  const met = new Set(
    [...weekly].filter(([, goal]) => isWeeklyGoalMet(goal)).map(([id]) => id),
  );
  const ordered = [
    ...daily.filter((habit) => !done.has(habit.id)),
    ...scheduled.filter((habit) => weekly.has(habit.id) && !met.has(habit.id) && !done.has(habit.id)),
    ...scheduled.filter((habit) => met.has(habit.id)),
    ...scheduled.filter((habit) => done.has(habit.id) && !met.has(habit.id)),
  ];
  return {
    dateLabel: formatDate(today, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    progress: daily.length
      ? `${completed} of ${daily.length} complete`
      : weekly.size ? "Weekly goals" : "No habits planned",
    rows: ordered
      .slice(0, 3)
      .map((habit) => {
        const goal = weekly.get(habit.id);
        const name = habit.name.length > 35 ? habit.name.slice(0, 34) + "…" : habit.name;
        return `${done.has(habit.id) || met.has(habit.id) ? "✓" : "☐"} ${habit.emoji} ${name}${goal ? ` · ${goal.completed}/${goal.target} this week` : ""}`;
      }),
    more: scheduled.length > 3 ? `+${scheduled.length - 3} more in Still` : "",
  };
}
