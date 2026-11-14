import type { Completion, DateKey, Habit } from "./models";
import { isScheduled, summarize, weeklyGoalProgress } from "./habits";
import { weekDates } from "./dates";
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
  const doneToday = new Set(
    records.filter((record) => record.date === today).map((record) => record.habitId),
  );
  return habits.filter(
    (habit) => !habit.archived && (doneToday.has(habit.id) || isScheduled(habit, today)),
  );
}

export function weeklyRecap(
  habits: Habit[],
  records: Completion[],
  today: DateKey,
) {
  const dates = weekDates(today).filter((date) => date <= today);
  const total = summarize(habits, records, dates, today);
  const mostConsistent = habits
    .map((habit) => ({ habit, ...summarize([habit], records, dates, today) }))
    .filter((result) => result.completed > 0)
    .sort(
      (a, b) =>
        b.completed * a.scheduled - a.completed * b.scheduled ||
        b.completed - a.completed ||
        a.habit.name.localeCompare(b.habit.name),
    )[0];
  const missedDays = dailyProgress(
    habits,
    records,
    dates.slice(0, -1),
    today,
  ).filter((day) => day.completed < day.scheduled);
  const lowest = missedDays.reduce<(typeof missedDays)[number] | undefined>(
    (lowest, day) =>
      !lowest ||
      day.completed * lowest.scheduled < lowest.completed * day.scheduled
        ? day
        : lowest,
    undefined,
  );
  const hardestDays = lowest
    ? missedDays.filter(
        (day) =>
          day.completed * lowest.scheduled === lowest.completed * day.scheduled,
      )
    : [];
  const weeklyGoals = habits
    .filter((habit) => habit.schedules.some((schedule) => schedule.weeklyTarget !== undefined))
    .map((habit) => ({ habit, ...weeklyGoalProgress(habit, records, today) }))
    .filter((goal) => goal.target > 0);
  return { dates, total, mostConsistent, hardestDays, weeklyGoals };
}
