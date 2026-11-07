export type DateKey = string;
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type TimeOfDay = "anytime" | "morning" | "afternoon" | "evening";
export interface Schedule {
  effectiveDate: DateKey;
  weekdays: Weekday[];
  weeklyTarget?: number;
}
// startDate is inclusive; endDate is the first paused date (exclusive).
export interface ActivePeriod {
  startDate: DateKey;
  endDate: DateKey | null;
}
export interface Habit {
  timeOfDay?: TimeOfDay;
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  createdDate: DateKey;
  archived: boolean;
  schedules: Schedule[];
  periods: ActivePeriod[];
  reminderTime: string | null;
}
export interface HabitDraft {
  timeOfDay?: TimeOfDay;
  name: string;
  emoji: string;
  color: string;
  description: string;
  weekdays: Weekday[];
  weeklyTarget?: number;
  reminderTime: string | null;
}
export interface Completion {
  habitId: string;
  date: DateKey;
}
export interface AppSettings {
  theme: "light" | "dark" | "system";
  remindersEnabled: boolean;
  hapticsEnabled: boolean;
}
export interface Snapshot {
  habits: Habit[];
  completions: Completion[];
  settings: AppSettings;
}
export const WEEKDAYS: { value: Weekday; short: string; label: string }[] = [
  { value: 1, short: "M", label: "Monday" },
  { value: 2, short: "T", label: "Tuesday" },
  { value: 3, short: "W", label: "Wednesday" },
  { value: 4, short: "T", label: "Thursday" },
  { value: 5, short: "F", label: "Friday" },
  { value: 6, short: "S", label: "Saturday" },
  { value: 0, short: "S", label: "Sunday" },
];
export const HABIT_COLORS = [
  "#6B56BB",
  "#367C74",
  "#A55773",
  "#94682F",
  "#426DA8",
  "#6D7A3D",
];
export const HABIT_EMOJIS = [
  "🌱",
  "💧",
  "📖",
  "🧘",
  "🚶",
  "🏃",
  "✍️",
  "💤",
  "🎨",
  "💪",
  "🍎",
  "🎵",
  "💊",
];
