import type { Completion, DateKey, Habit, HabitDraft, Weekday } from "./models";
import { datesBetween, parseDate, weekDates } from "./dates";
import { isHabitEmoji } from "./emoji";
import { isTimeOfDay } from "./groups";

export function scheduleOn(habit: Habit, date: DateKey) {
  return habit.schedules.findLast((schedule) => schedule.effectiveDate <= date);
}
export function pendingResumeDate(habit: Habit, today: DateKey) {
  if (habit.archived || habit.createdDate > today) return;
  return habit.periods.find(
    (period) => period.endDate === null && period.startDate > today,
  )?.startDate;
}
function isActiveOn(habit: Habit, date: DateKey): boolean {
  return habit.periods.some(
    (period) =>
      period.startDate <= date && (!period.endDate || period.endDate > date),
  );
}
export function pausedUntil(habit: Habit, today: DateKey) {
  const resumeDate = pendingResumeDate(habit, today);
  return resumeDate && !isActiveOn(habit, today) ? resumeDate : undefined;
}
export function isScheduled(habit: Habit, date: DateKey): boolean {
  if (date < habit.createdDate || !isActiveOn(habit, date)) return false;
  const schedule = scheduleOn(habit, date);
  return !!schedule && (
    schedule.weeklyTarget !== undefined ||
    schedule.weekdays.includes(parseDate(date).getDay() as Weekday)
  );
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
    (date) =>
      scheduleOn(habit, date)?.weeklyTarget === undefined &&
      (isScheduled(habit, date) || completed.has(date)),
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
    totalCompleted: completed.size,
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
      if (
        scheduleOn(habit, date)?.weeklyTarget === undefined &&
        (isScheduled(habit, date) || done.has(date))
      ) {
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
export function weeklyGoalProgress(
  habit: Habit,
  records: Completion[],
  today: DateKey,
) {
  if (habit.createdDate > today) return { completed: 0, target: 0 };
  const done = completionSet(records, habit.id, today);
  let eligible = 0;
  let completed = 0;
  let target = 0;
  for (const day of weekDates(today)) {
    const goal = scheduleOn(habit, day)?.weeklyTarget;
    if (goal === undefined || !(done.has(day) || isScheduled(habit, day))) continue;
    eligible++;
    if (day <= today || target === 0) target = goal;
    if (done.has(day)) completed++;
  }
  return { completed, target: Math.min(target, eligible) };
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
    draft.weeklyTarget === undefined &&
    (!draft.weekdays.length ||
      draft.weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6))
  )
    errors.weekdays = "Choose at least one day.";
  if (
    draft.weeklyTarget !== undefined &&
    (!Number.isInteger(draft.weeklyTarget) || draft.weeklyTarget < 1 || draft.weeklyTarget > 7)
  )
    errors.weeklyTarget = "Choose a goal between 1 and 7 days.";
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
    weekdays: draft.weeklyTarget === undefined
      ? [...new Set(draft.weekdays)].sort((a, b) => a - b)
      : [],
  };
}
