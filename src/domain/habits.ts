import type { Completion, DateKey, Habit, HabitDraft, Weekday } from "./models";
import { datesBetween, parseDate } from "./dates";
import { isHabitEmoji } from "./emoji";
import { isTimeOfDay } from "./groups";

export function isScheduled(habit: Habit, date: DateKey): boolean {
  if (
    date < habit.createdDate ||
    !habit.periods.some(
      (period) =>
        period.startDate <= date && (!period.endDate || period.endDate > date),
    )
  )
    return false;
  const schedule = [...habit.schedules]
    .reverse()
    .find((value) => value.effectiveDate <= date);
  return !!schedule?.weekdays.includes(parseDate(date).getDay() as Weekday);
}
export function completionSet(
  records: Completion[],
  habitId: string,
  today: DateKey,
) {
  return new Set(
    records
      .filter((value) => value.habitId === habitId && value.date <= today)
      .map((value) => value.date),
  );
}
export function habitStats(
  habit: Habit,
  records: Completion[],
  today: DateKey,
) {
  const completed = completionSet(records, habit.id, today);
  const eligible = datesBetween(habit.createdDate, today).filter(
    (date) => isScheduled(habit, date) || completed.has(date),
  );
  let run = 0,
    longestStreak = 0,
    totalCompleted = 0;
  for (const date of eligible) {
    if (completed.has(date)) {
      run++;
      totalCompleted++;
      longestStreak = Math.max(longestStreak, run);
    } else if (date !== today) run = 0;
  }
  return {
    currentStreak: run,
    longestStreak,
    totalCompleted,
    completionRate: eligible.length
      ? Math.round((totalCompleted / eligible.length) * 100)
      : 0,
  };
}
export function summarize(
  habits: Habit[],
  records: Completion[],
  dates: DateKey[],
  today: DateKey,
) {
  let completed = 0,
    scheduled = 0;
  for (const habit of habits) {
    const done = completionSet(records, habit.id, today);
    for (const date of dates) {
      if (date > today) continue;
      if (isScheduled(habit, date) || done.has(date)) {
        scheduled++;
        if (done.has(date)) completed++;
      }
    }
  }
  return {
    completed,
    scheduled,
    rate: scheduled ? Math.round((completed / scheduled) * 100) : 0,
  };
}
export type HabitDraftErrors = Partial<Record<keyof HabitDraft, string>>;
export function getDraftErrors(draft: HabitDraft): HabitDraftErrors {
  const errors: HabitDraftErrors = {};
  const name = draft.name.trim();
  if (draft.timeOfDay !== undefined && !isTimeOfDay(draft.timeOfDay))
    errors.timeOfDay = "Choose a valid time of day.";
  if (!name || name.length > 80)
    errors.name = "Give your habit a name of 1–80 characters.";
  if (
    !draft.weekdays.length ||
    draft.weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)
  )
    errors.weekdays = "Choose at least one day.";
  if (
    draft.reminderTime !== null &&
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.reminderTime)
  )
    errors.reminderTime = "Choose a valid reminder time.";
  if (draft.description.length > 500)
    errors.description = "Keep the description under 500 characters.";
  if (!isHabitEmoji(draft.emoji)) errors.emoji = "Choose or enter one emoji.";
  if (!/^#[0-9a-fA-F]{6}$/.test(draft.color)) errors.color = "Choose a color.";
  return errors;
}
export function validateDraft(draft: HabitDraft): HabitDraft {
  const firstError = Object.values(getDraftErrors(draft))[0];
  if (firstError) throw new Error(firstError);
  return {
    ...draft,
    name: draft.name.trim(),
    emoji: draft.emoji.trim(),
    description: draft.description.trim(),
    weekdays: [...new Set(draft.weekdays)].sort((a, b) => a - b),
  };
}
