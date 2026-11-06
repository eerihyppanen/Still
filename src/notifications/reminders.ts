import type { Habit } from "../domain/models";
export interface ReminderPlan {
  id: string;
  habitId: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  weekday: number | null;
  signature: string;
}
export interface ScheduledReminder {
  id: string;
  signature: string;
}
export interface ReminderDriver {
  list(): Promise<ScheduledReminder[]>;
  cancel(id: string): Promise<void>;
  schedule(plan: ReminderPlan): Promise<void>;
}
export function buildReminderPlan(
  habits: Habit[],
  today: string,
  timeZone: string,
): ReminderPlan[] {
  return habits.flatMap((habit) => {
    if (habit.archived || !habit.reminderTime) return [];
    const schedule = [...habit.schedules]
      .reverse()
      .find((s) => s.effectiveDate <= today);
    if (!schedule) return [];
    const [hour = 9, minute = 0] = habit.reminderTime.split(":").map(Number);
    const days =
      schedule.weekdays.length === 7
        ? [null]
        : [...schedule.weekdays].sort((a, b) => a - b).map((day) => day + 1);
    return days.map((weekday) => {
      const id = `still:${habit.id}:${weekday ?? "daily"}`;
      const title = `${habit.emoji} ${habit.name}`;
      const body = "Check in when you’re done.";
      return {
        id,
        habitId: habit.id,
        title,
        body,
        weekday,
        hour,
        minute,
        signature: JSON.stringify([
          "actions-v2",
          title,
          body,
          weekday,
          hour,
          minute,
          timeZone,
        ]),
      };
    });
  });
}
export async function reconcileReminders(
  driver: ReminderDriver,
  desired: ReminderPlan[],
  enabled: boolean,
): Promise<void> {
  const existing = (await driver.list()).filter((item) =>
    item.id.startsWith("still:"),
  );
  const wanted = enabled ? desired : [];
  // Keep below the iOS pending-notification ceiling. Never silently omit a habit.
  if (wanted.length > 60) {
    for (const item of existing) await driver.cancel(item.id);
    throw new Error(
      "Reminders need more than 60 notification slots. Turn off some habit reminders or use an every-day schedule.",
    );
  }
  const byId = new Map(wanted.map((item) => [item.id, item]));
  try {
    for (const item of existing)
      if (item.signature !== byId.get(item.id)?.signature)
        await driver.cancel(item.id);
    const unchanged = new Set(
      existing
        .filter((item) => item.signature === byId.get(item.id)?.signature)
        .map((item) => item.id),
    );
    for (const item of wanted)
      if (!unchanged.has(item.id)) await driver.schedule(item);
  } catch (error) {
    // Remove any partially updated set; the saved preferences can safely be retried on resume.
    for (const item of await driver.list())
      if (item.id.startsWith("still:")) await driver.cancel(item.id);
    throw error;
  }
}
