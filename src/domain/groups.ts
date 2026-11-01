import type { Habit, TimeOfDay } from "./models";

export const TIME_GROUPS: { key: TimeOfDay; title: string }[] = [
  { key: "morning", title: "Morning" },
  { key: "afternoon", title: "Afternoon" },
  { key: "evening", title: "Evening" },
  { key: "anytime", title: "Anytime" },
];
export function isTimeOfDay(value: unknown): value is TimeOfDay {
  return TIME_GROUPS.some((group) => group.key === value);
}
export function groupTodayHabits(habits: Habit[]) {
  if (!habits.some((habit) => habit.timeOfDay && habit.timeOfDay !== "anytime"))
    return [{ key: "anytime" as const, title: "Today’s habits", habits }];
  return TIME_GROUPS.map((group) => ({
    ...group,
    habits: habits.filter(
      (habit) => (habit.timeOfDay ?? "anytime") === group.key,
    ),
  })).filter((group) => group.habits.length);
}
