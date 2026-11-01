export function formatReminderTime(
  value: string,
  uses24hourClock: boolean,
  locale?: string,
): string {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return value;
  const [hour = 0, minute = 0] = value.split(":").map(Number);
  return new Intl.DateTimeFormat(locale, {
    hour: uses24hourClock ? "2-digit" : "numeric",
    minute: "2-digit",
    hourCycle: uses24hourClock ? "h23" : "h12",
  }).format(new Date(2020, 0, 1, hour, minute));
}
