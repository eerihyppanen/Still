import type {
  AppSettings,
  DateKey,
  Habit,
  HabitDraft,
  Snapshot,
  Weekday,
} from "../domain/models";
import { parseDate } from "../domain/dates";
import { isScheduled, validateDraft } from "../domain/habits";
import { migrate } from "./migrations";
import { isTimeOfDay } from "../domain/groups";
export type SqlParam = string | number | null;
export interface SqlDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: SqlParam[]): Promise<{ changes: number }>;
  getFirstAsync<T>(sql: string, ...params: SqlParam[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: SqlParam[]): Promise<T[]>;
}
export class HabitRepository {
  // Every read and mutation shares this queue. A snapshot cannot observe a half-written transaction.
  private tail: Promise<unknown> = Promise.resolve();
  constructor(private db: SqlDatabase) {}
  private serial<T>(action: () => Promise<T>): Promise<T> {
    const task = this.tail.then(action);
    this.tail = task.catch(() => undefined);
    return task;
  }
  private async transaction<T>(action: () => Promise<T>): Promise<T> {
    await this.db.execAsync("BEGIN IMMEDIATE");
    try {
      const result = await action();
      await this.db.execAsync("COMMIT");
      return result;
    } catch (error) {
      await this.db.execAsync("ROLLBACK");
      throw error;
    }
  }
  initialize() {
    return this.serial(() => migrate(this.db));
  }
  snoozeDeadline(receipt: string, proposed: number): Promise<number> {
    return this.serial(() =>
      this.transaction(async () => {
        // Retain two days of action receipts; old notifications are rejected before reaching this method.
        await this.db.runAsync(
          "DELETE FROM settings WHERE key LIKE 'reminderAction:%' AND CAST(value AS INTEGER) < ?",
          proposed - 2 * 86400000,
        );
        const key = `reminderAction:${receipt}`;
        await this.db.runAsync(
          "INSERT OR IGNORE INTO settings(key,value) VALUES (?,?)",
          key,
          String(proposed),
        );
        return Number(
          (await this.db.getFirstAsync<{ value: string }>(
            "SELECT value FROM settings WHERE key=?",
            key,
          ))!.value,
        );
      }),
    );
  }
  completeReminder(
    id: string,
    date: DateKey,
    receipt: string,
    reminderTime?: string,
  ): Promise<boolean> {
    return this.serial(() =>
      this.transaction(async () => {
        parseDate(date);
        const key = `reminderAction:done:${receipt}`;
        await this.db.runAsync(
          "DELETE FROM settings WHERE key LIKE 'reminderAction:%' AND CAST(value AS INTEGER) < ?",
          Date.now() - 2 * 86400000,
        );
        if (
          await this.db.getFirstAsync(
            "SELECT value FROM settings WHERE key=?",
            key,
          )
        )
          return false;
        const snapshot = await this.readSnapshot();
        const habit = snapshot.habits.find((habit) => habit.id === id);
        if (
          !snapshot.settings.remindersEnabled ||
          !habit ||
          habit.archived ||
          !habit.reminderTime ||
          (reminderTime !== undefined && habit.reminderTime !== reminderTime) ||
          !isScheduled(habit, date)
        )
          return false;
        const result = await this.db.runAsync(
          "INSERT OR IGNORE INTO completions(habit_id,date) VALUES (?,?)",
          id,
          date,
        );
        await this.db.runAsync(
          "INSERT INTO settings(key,value) VALUES (?,?)",
          key,
          String(Date.now()),
        );
        return result.changes > 0;
      }),
    );
  }
  private writeHabitOrder(order: string[]) {
    return this.db.runAsync(
      "INSERT INTO settings(key,value) VALUES ('habitOrder',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      JSON.stringify(order),
    );
  }
  snapshot() {
    return this.serial(() => this.readSnapshot());
  }
  private async readSnapshot(): Promise<Snapshot> {
    const rows = await this.db.getAllAsync<{
      id: string;
      name: string;
      emoji: string;
      color: string;
      description: string;
      created_date: string;
      archived: number;
      reminder_time: string | null;
    }>("SELECT * FROM habits ORDER BY created_date, rowid");
    const schedules = await this.db.getAllAsync<{
      habit_id: string;
      effective_date: string;
      weekdays: string;
    }>("SELECT * FROM schedules ORDER BY effective_date");
    const periods = await this.db.getAllAsync<{
      habit_id: string;
      start_date: string;
      end_date: string | null;
    }>("SELECT * FROM active_periods ORDER BY start_date, id");
    const habits: Habit[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      emoji: row.emoji,
      color: row.color,
      description: row.description,
      createdDate: row.created_date,
      archived: !!row.archived,
      reminderTime: row.reminder_time,
      schedules: schedules
        .filter((s) => s.habit_id === row.id)
        .map((s) => ({
          effectiveDate: s.effective_date,
          weekdays: JSON.parse(s.weekdays) as Weekday[],
        })),
      periods: periods
        .filter((p) => p.habit_id === row.id)
        .map((p) => ({ startDate: p.start_date, endDate: p.end_date })),
    }));
    const completions = await this.db.getAllAsync<{
      habitId: string;
      date: string;
    }>("SELECT habit_id AS habitId, date FROM completions ORDER BY date");
    const settingsRows = await this.db.getAllAsync<{
      key: string;
      value: string;
    }>("SELECT * FROM settings");
    const values = Object.fromEntries(
      settingsRows.map((row) => [row.key, row.value]),
    );
    for (const habit of habits) {
      const group = values[`habitTimeOfDay:${habit.id}`];
      if (isTimeOfDay(group)) habit.timeOfDay = group;
    }
    // Older databases have no custom order. Ignore bad metadata without hiding habits.
    let order: unknown;
    try {
      order = JSON.parse(values.habitOrder ?? "[]");
    } catch {
      order = [];
    }
    if (Array.isArray(order)) {
      const positions = new Map<string, number>();
      for (const id of order)
        if (typeof id === "string" && !positions.has(id))
          positions.set(id, positions.size);
      habits.sort(
        (a, b) =>
          (positions.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
          (positions.get(b.id) ?? Number.MAX_SAFE_INTEGER),
      );
    }
    return {
      habits,
      completions,
      settings: {
        theme:
          values.theme === "light" || values.theme === "dark"
            ? values.theme
            : "system",
        remindersEnabled: values.remindersEnabled === "true",
        hapticsEnabled: values.hapticsEnabled === "true",
      },
    };
  }
  saveHabit(input: HabitDraft, today: DateKey, id?: string): Promise<string> {
    return this.serial(async () => {
      const draft = validateDraft(input);
      parseDate(today);
      return this.transaction(async () => {
        const existingOrder = id
          ? undefined
          : (await this.readSnapshot()).habits.map((habit) => habit.id);
        const habitId =
          id ??
          (await this.db.getFirstAsync<{ id: string }>(
            "SELECT lower(hex(randomblob(16))) AS id",
          ))!.id;
        if (id) {
          const result = await this.db.runAsync(
            "UPDATE habits SET name=?, emoji=?, color=?, description=?, reminder_time=?, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?",
            draft.name,
            draft.emoji,
            draft.color,
            draft.description,
            draft.reminderTime,
            id,
          );
          if (!result.changes) throw new Error("This habit no longer exists.");
        } else {
          await this.db.runAsync(
            "INSERT INTO habits (id,name,emoji,color,description,created_date,reminder_time) VALUES (?,?,?,?,?,?,?)",
            habitId,
            draft.name,
            draft.emoji,
            draft.color,
            draft.description,
            today,
            draft.reminderTime,
          );
          await this.db.runAsync(
            "INSERT INTO active_periods (habit_id,start_date) VALUES (?,?)",
            habitId,
            today,
          );
          await this.writeHabitOrder([...(existingOrder ?? []), habitId]);
        }
        const previous = await this.db.getFirstAsync<{ weekdays: string }>(
          "SELECT weekdays FROM schedules WHERE habit_id=? AND effective_date<=? ORDER BY effective_date DESC LIMIT 1",
          habitId,
          today,
        );
        const days = JSON.stringify(draft.weekdays);
        if (!previous || previous.weekdays !== days)
          await this.db.runAsync(
            "INSERT INTO schedules (habit_id,effective_date,weekdays) VALUES (?,?,?) ON CONFLICT(habit_id,effective_date) DO UPDATE SET weekdays=excluded.weekdays",
            habitId,
            today,
            days,
          );
        await this.db.runAsync(
          "INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
          `habitTimeOfDay:${habitId}`,
          draft.timeOfDay ?? "anytime",
        );
        return habitId;
      });
    });
  }
  setCompletion(id: string, date: DateKey, complete: boolean, today: DateKey) {
    return this.setCompletionAndSnapshot(id, date, complete, today).then(
      ({ changed }) => changed,
    );
  }
  setCompletionAndSnapshot(
    id: string,
    date: DateKey,
    complete: boolean,
    today: DateKey,
  ) {
    return this.serial(() =>
      this.transaction(async () => {
        parseDate(date);
        parseDate(today);
        if (date > today) throw new Error("Future dates cannot be completed.");
        const snapshot = await this.readSnapshot();
        const habit = snapshot.habits.find((h) => h.id === id);
        if (!habit) throw new Error("This habit no longer exists.");
        const index = snapshot.completions.findIndex(
          (entry) => entry.habitId === id && entry.date === date,
        );
        if (complete) {
          if (!isScheduled(habit, date))
            throw new Error("This habit was not scheduled for that date.");
          const result = await this.db.runAsync(
            "INSERT OR IGNORE INTO completions (habit_id,date) VALUES (?,?)",
            id,
            date,
          );
          if (index < 0) {
            const nextDate = snapshot.completions.findIndex(
              (entry) => entry.date > date,
            );
            snapshot.completions.splice(
              nextDate < 0 ? snapshot.completions.length : nextDate,
              0,
              { habitId: id, date },
            );
          }
          return { changed: result.changes > 0, snapshot };
        }
        const result = await this.db.runAsync(
          "DELETE FROM completions WHERE habit_id=? AND date=?",
          id,
          date,
        );
        if (index >= 0) snapshot.completions.splice(index, 1);
        return { changed: result.changes > 0, snapshot };
      }),
    );
  }
  setArchived(id: string, archived: boolean, today: DateKey) {
    return this.serial(() =>
      this.transaction(async () => {
        parseDate(today);
        const habit = await this.db.getFirstAsync<{ archived: number }>(
          "SELECT archived FROM habits WHERE id=?",
          id,
        );
        if (!habit) throw new Error("This habit no longer exists.");
        if (!!habit.archived === archived) return;
        if (archived)
          await this.db.runAsync(
            "UPDATE active_periods SET end_date=MAX(start_date, ?) WHERE habit_id=? AND end_date IS NULL",
            today,
            id,
          );
        else {
          const last = await this.db.getFirstAsync<{
            id: number;
            end_date: string;
          }>(
            "SELECT id,end_date FROM active_periods WHERE habit_id=? ORDER BY id DESC LIMIT 1",
            id,
          );
          if (last && last.end_date >= today)
            await this.db.runAsync(
              "UPDATE active_periods SET end_date=NULL WHERE id=?",
              last.id,
            );
          else
            await this.db.runAsync(
              "INSERT INTO active_periods (habit_id,start_date) VALUES (?,?)",
              id,
              today,
            );
        }
        await this.db.runAsync(
          "UPDATE habits SET archived=?, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?",
          archived ? 1 : 0,
          id,
        );
      }),
    );
  }
  deleteHabit(id: string) {
    return this.serial(() =>
      this.transaction(async () => {
        await this.db.runAsync("DELETE FROM habits WHERE id=?", id);
        await this.db.runAsync(
          "DELETE FROM settings WHERE key=?",
          `habitTimeOfDay:${id}`,
        );
      }),
    );
  }
  reorderHabits(ids: string[]) {
    // Copy before queueing so callers cannot mutate an in-flight request.
    const requested = [...ids];
    return this.serial(() =>
      this.transaction(async () => {
        const { habits } = await this.readSnapshot();
        const active = habits.filter((habit) => !habit.archived);
        const valid = new Set(active.map((habit) => habit.id));
        if (
          requested.length !== active.length ||
          new Set(requested).size !== requested.length ||
          requested.some((id) => !valid.has(id))
        ) {
          throw new Error(
            "Your habits changed. Try reordering the updated list.",
          );
        }
        let index = 0;
        await this.writeHabitOrder(
          habits.map((habit) =>
            habit.archived ? habit.id : requested[index++]!,
          ),
        );
      }),
    );
  }
  moveHabit(id: string, direction: "up" | "down") {
    return this.serial(() =>
      this.transaction(async () => {
        const { habits } = await this.readSnapshot();
        const active = habits.filter((habit) => !habit.archived);
        const index = active.findIndex((habit) => habit.id === id);
        if (index < 0)
          throw new Error("This habit is no longer available to reorder.");
        const neighbor = active[index + (direction === "up" ? -1 : 1)];
        if (!neighbor) return;
        const order = habits.map((habit) =>
          habit.id === id
            ? neighbor.id
            : habit.id === neighbor.id
              ? id
              : habit.id,
        );
        await this.writeHabitOrder(order);
      }),
    );
  }
  saveSettings(settings: AppSettings) {
    return this.serial(() =>
      this.transaction(async () => {
        for (const [key, value] of Object.entries(settings))
          await this.db.runAsync(
            "INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            key,
            String(value),
          );
      }),
    );
  }
}
