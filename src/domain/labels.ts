import { formatDate } from "./dates";
import type { DateKey } from "./models";

export function streakLabel(days: number): string {
  return days === 0 ? "Start today" : `${days}-day streak`;
}

export function weeklyGoalLabel(completed: number, target: number): string {
  return target ? `${completed}/${target} this week` : "No goal this week";
}

export function resumeDateLabel(date: DateKey, today: DateKey): string {
  return formatDate(date, {
    month: "short",
    day: "numeric",
    ...(date.slice(0, 4) !== today.slice(0, 4) ? { year: "numeric" } : {}),
  });
}
