export function streakLabel(days: number): string {
  return days === 0 ? "Start today" : `${days}-day streak`;
}
