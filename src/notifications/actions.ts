import { addDays, dateKey, parseDate } from "../domain/dates";
import { isScheduled } from "../domain/habits";
import type { Habit, Snapshot } from "../domain/models";

export const REMINDER_CATEGORY = "stillHabitActions";
export const SNOOZE_PREFIX = "still-snooze:";
export const NOTIFICATION_TASK = "still-reminder-actions";
export interface ReminderAction {
  action: "done" | "snooze";
  habitId: string;
  date: string;
  notificationId: string;
  receipt: string;
  reminderTime?: string;
}
export interface SnoozePlan {
  id: string;
  habit: Habit;
  date: string;
  fireAt: number;
  receipt: string;
}
export interface ReminderActionDriver {
  snapshot(): Promise<Snapshot>;
  complete(habitId: string, date: string): Promise<void>;
  snooze(plan: SnoozePlan): Promise<void>;
  cancelSnoozes(habitId: string): Promise<void>;
  dismiss(notificationId: string): Promise<void>;
}
type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue =>
  value !== null && typeof value === "object" ? (value as RecordValue) : {};

export function parseReminderResponse(value: unknown): ReminderAction | null {
  const response = record(value);
  const action =
    response.actionIdentifier === "stillDone"
      ? "done"
      : response.actionIdentifier === "stillSnooze"
        ? "snooze"
        : null;
  if (!action) return null;
  const notification = record(response.notification);
  const request = record(notification.request);
  const content = record(request.content);
  let data = record(content.data);
  // Foreground Expo listeners normalize this JSON; Android TaskManager sends it raw.
  if (typeof content.dataString === "string") {
    try {
      data = { ...record(JSON.parse(content.dataString)), ...data };
    } catch {
      return null;
    }
  }
  const { habitId } = data;
  if (typeof habitId !== "string" || !habitId || habitId.includes(":"))
    return null;
  if (
    typeof request.identifier !== "string" ||
    !(
      request.identifier.startsWith(`still:${habitId}:`) ||
      request.identifier.startsWith(`${SNOOZE_PREFIX}${habitId}:`)
    )
  )
    return null;
  if (
    typeof notification.date !== "number" ||
    !Number.isFinite(notification.date)
  )
    return null;
  let date =
    typeof data.occurrenceDate === "string"
      ? data.occurrenceDate
      : dateKey(new Date(notification.date));
  if (
    typeof data.occurrenceDate !== "string" &&
    typeof data.reminderTime === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(data.reminderTime)
  ) {
    // Android timestamps the posting time. Find the last scheduled occurrence.
    const delivered = new Date(notification.date);
    const [hour, minute] = data.reminderTime.split(":").map(Number);
    if (
      delivered.getHours() * 60 + delivered.getMinutes() <
      hour! * 60 + minute!
    )
      date = addDays(date, -1);
    if (
      typeof data.scheduleWeekday === "number" &&
      Number.isInteger(data.scheduleWeekday) &&
      data.scheduleWeekday >= 1 &&
      data.scheduleWeekday <= 7
    ) {
      while (parseDate(date).getDay() !== data.scheduleWeekday - 1)
        date = addDays(date, -1);
    }
  }
  try {
    parseDate(date);
  } catch {
    return null;
  }
  return {
    action,
    habitId,
    date,
    notificationId: request.identifier,
    receipt: `${request.identifier}|${notification.date}|${action}`,
    reminderTime:
      typeof data.reminderTime === "string" ? data.reminderTime : undefined,
  };
}
export function snoozeIsCurrent(
  data: RecordValue,
  snapshot: Snapshot,
  today: string,
): boolean {
  const habit = snapshot.habits.find((habit) => habit.id === data.habitId);
  return !!(
    snapshot.settings.remindersEnabled &&
    data.date === today &&
    habit &&
    !habit.archived &&
    habit.reminderTime &&
    (data.reminderTime === undefined ||
      data.reminderTime === habit.reminderTime) &&
    isScheduled(habit, today) &&
    !snapshot.completions.some(
      (c) => c.habitId === habit.id && c.date === today,
    )
  );
}
interface SnoozeRecord {
  id: string;
  data: Record<string, unknown>;
}
export async function reconcileSnoozes(
  driver: {
    scheduled(): Promise<SnoozeRecord[]>;
    presented(): Promise<SnoozeRecord[]>;
    cancel(id: string): Promise<void>;
    dismiss(id: string): Promise<void>;
  },
  snapshot: Snapshot,
  today: string,
): Promise<void> {
  for (const item of await driver.scheduled())
    if (
      item.id.startsWith(SNOOZE_PREFIX) &&
      !snoozeIsCurrent(item.data, snapshot, today)
    )
      await driver.cancel(item.id);
  for (const item of await driver.presented())
    if (
      item.id.startsWith(SNOOZE_PREFIX) &&
      !snoozeIsCurrent(item.data, snapshot, today)
    )
      await driver.dismiss(item.id);
}
export async function runReminderAction(
  action: ReminderAction,
  driver: ReminderActionDriver,
  now = Date.now(),
): Promise<"done" | "snoozed" | "ignored"> {
  const today = dateKey(new Date(now));
  const snapshot = await driver.snapshot();
  const habit = snapshot.habits.find((habit) => habit.id === action.habitId);
  if (
    !snoozeIsCurrent(
      {
        habitId: action.habitId,
        date: action.date,
        reminderTime: action.reminderTime,
      },
      snapshot,
      today,
    ) ||
    !habit
  ) {
    if (action.date === today) await driver.cancelSnoozes(action.habitId);
    await driver.dismiss(action.notificationId);
    return "ignored";
  }
  if (action.action === "done") {
    await driver.complete(habit.id, today);
    await driver.cancelSnoozes(habit.id);
    await driver.dismiss(action.notificationId);
    return "done";
  }
  const fireAt = now + 10 * 60 * 1000;
  if (dateKey(new Date(fireAt)) !== today)
    throw new Error(
      "A ten-minute snooze would fall on tomorrow. Open Still to review this habit.",
    );
  await driver.snooze({
    id: `${SNOOZE_PREFIX}${habit.id}:${today}`,
    habit,
    date: today,
    fireAt,
    receipt: action.receipt,
  });
  await driver.dismiss(action.notificationId);
  return "snoozed";
}
