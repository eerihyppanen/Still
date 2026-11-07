import type { SqlDatabase } from "./repository";
export const SCHEMA_VERSION = 2;

export async function migrate(db: SqlDatabase): Promise<void> {
  await db.execAsync(
    "PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;",
  );
  await db.execAsync("BEGIN IMMEDIATE");
  try {
    const version =
      (await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))
        ?.user_version ?? 0;
    if (version > SCHEMA_VERSION)
      throw new Error(
        "This database was created by a newer version of Still. Update the app to open it safely.",
      );
    if (version === 0) await db.execAsync(`
      CREATE TABLE habits (
        id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, emoji TEXT NOT NULL,
        color TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', created_date TEXT NOT NULL,
        archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0,1)), reminder_time TEXT,
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      );
      CREATE TABLE schedules (
        habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        effective_date TEXT NOT NULL, weekdays TEXT NOT NULL,
        PRIMARY KEY (habit_id, effective_date)
      );
      CREATE TABLE active_periods (
        id INTEGER PRIMARY KEY, habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        start_date TEXT NOT NULL, end_date TEXT, CHECK (end_date IS NULL OR end_date >= start_date)
      );
      CREATE UNIQUE INDEX one_open_period ON active_periods(habit_id) WHERE end_date IS NULL;
      CREATE TABLE completions (
        habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE, date TEXT NOT NULL,
        completed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
        PRIMARY KEY (habit_id, date)
      );
      CREATE INDEX completions_by_date ON completions(date);
      CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    `);
    if (version < 2) await db.execAsync(`
      ALTER TABLE schedules ADD COLUMN weekly_target INTEGER CHECK (weekly_target BETWEEN 1 AND 7);
      PRAGMA user_version = 2;
    `);
    await db.execAsync("COMMIT");
  } catch (error) {
    await db.execAsync("ROLLBACK");
    throw error;
  }
}
