import type { DateKey } from "./models";
const pad = (value: number) => String(value).padStart(2, "0");
export function dateKey(date = new Date()): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
export function parseDate(value: DateKey): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Invalid calendar date");
  const [year = 0, month = 0, day = 0] = value.split("-").map(Number);
  const result = new Date(year, month - 1, day, 12);
  if (dateKey(result) !== value) throw new Error("Invalid calendar date");
  return result;
}
export function addDays(value: DateKey, amount: number): DateKey {
  const date = parseDate(value);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}
export function datesBetween(start: DateKey, end: DateKey): DateKey[] {
  parseDate(start);
  parseDate(end);
  const result: DateKey[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) result.push(day);
  return result;
}
export function monthDates(value: DateKey): DateKey[] {
  const date = parseDate(value);
  return datesBetween(
    dateKey(new Date(date.getFullYear(), date.getMonth(), 1, 12)),
    dateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0, 12)),
  );
}
export function weekDates(value: DateKey): DateKey[] {
  const start = addDays(value, -((parseDate(value).getDay() + 6) % 7));
  return datesBetween(start, addDays(start, 6));
}
export function shiftMonth(value: DateKey, amount: number): DateKey {
  const date = parseDate(value);
  return dateKey(new Date(date.getFullYear(), date.getMonth() + amount, 1, 12));
}
export function formatDate(
  value: DateKey,
  options: Intl.DateTimeFormatOptions,
): string {
  return parseDate(value).toLocaleDateString("en", options);
}
