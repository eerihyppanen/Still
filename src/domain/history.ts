import type { Completion, DateKey, Habit } from "./models";
import { isScheduled, summarize } from "./habits";
export function dailyProgress(
  habits: Habit[],
  records: Completion[],
  dates: DateKey[],
  today: DateKey,
) {
  return dates.map((date) => ({
    date,
    ...summarize(habits, records, [date], today),
  }));
}
export function todayHabits(
  habits: Habit[],
  records: Completion[],
  today: DateKey,
): Habit[] {
  return habits.filter(
    (h) =>
      !h.archived &&
      (isScheduled(h, today) ||
        records.some((c) => c.habitId === h.id && c.date === today)),
  );
}
