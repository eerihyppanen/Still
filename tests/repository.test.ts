import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { HabitRepository, type SqlParam } from "../src/data/repository";
import { sqliteAdapter } from "./sqlite-adapter";
import type { HabitDraft } from "../src/domain/models";
import { isScheduled, habitStats } from "../src/domain/habits";

const draft: HabitDraft = {
  name: "Read",
  emoji: "📖",
  color: "#6B56BB",
  description: "",
  weekdays: [1, 2, 3, 4, 5, 6, 0],
  reminderTime: null,
};

test("a dropped full order persists with archived slots, history and settings intact", async () => {
  const dir = mkdtempSync(join(tmpdir(), "still-drop-test-"));
  const path = join(dir, "habits.db");
  let adapter = sqliteAdapter(path);
  try {
    let repo = new HabitRepository(adapter.db);
    await repo.initialize();
    const a = await repo.saveHabit(draft, "2026-10-30");
    const archived = await repo.saveHabit(
      { ...draft, name: "Archived" },
      "2026-10-30",
    );
    const b = await repo.saveHabit(
      { ...draft, name: "Walk", timeOfDay: "morning" },
      "2026-10-30",
    );
    const c = await repo.saveHabit({ ...draft, name: "Water" }, "2026-10-30");
    await repo.setCompletion(a, "2026-10-30", true, "2026-10-30");
    await repo.setArchived(archived, true, "2026-10-30");
    const before = await repo.snapshot();
    await repo.reorderHabits([c, a, b]);
    adapter.close();
    adapter = sqliteAdapter(path);
    repo = new HabitRepository(adapter.db);
    await repo.initialize();
    const after = await repo.snapshot();
    assert.deepEqual(
      after.habits.map((h) => h.id),
      [c, archived, a, b],
    );
    assert.deepEqual(after.completions, before.completions);
    assert.deepEqual(after.settings, before.settings);
    for (const h of before.habits)
      assert.deepEqual(
        after.habits.find((v) => v.id === h.id),
        h,
      );
    await repo.setArchived(archived, false, "2026-10-30");
    assert.deepEqual(
      (await repo.snapshot()).habits.map((h) => h.id),
      [c, archived, a, b],
    );
    assert.equal(
      (
        await adapter.db.getFirstAsync<{ user_version: number }>(
          "PRAGMA user_version",
        )
      )?.user_version,
      1,
    );
  } finally {
    adapter.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("invalid or stale drops reject atomically and do not poison the serial queue", async () => {
  const { db, close } = sqliteAdapter();
  const repo = new HabitRepository(db);
  try {
    await repo.initialize();
    const a = await repo.saveHabit(draft, "2026-10-30");
    const b = await repo.saveHabit({ ...draft, name: "Walk" }, "2026-10-30");
    const before = await repo.snapshot();
    for (const ids of [[a], [a, a], [b, "missing"], [a, b, "missing"]]) {
      await assert.rejects(repo.reorderHabits(ids), /changed|order/i);
      assert.deepEqual(await repo.snapshot(), before);
    }
    const create = repo.saveHabit({ ...draft, name: "New" }, "2026-10-30");
    const stale = repo.reorderHabits([b, a]);
    const c = await create;
    await assert.rejects(stale, /changed|order/i);
    await Promise.all([
      repo.reorderHabits([c, b, a]),
      repo.reorderHabits([b, a, c]),
    ]);
    assert.deepEqual(
      (await repo.snapshot()).habits.map((h) => h.id),
      [b, a, c],
    );
  } finally {
    close();
  }
});

test("notification Done receipt prevents a replay from undoing a later manual uncheck", async () => {
  const adapter = sqliteAdapter();
  try {
    const repo = new HabitRepository(adapter.db);
    await repo.initialize();
    const id = await repo.saveHabit(
      { ...draft, reminderTime: "09:00" },
      "2026-10-30",
    );
    await repo.saveSettings({
      theme: "system",
      remindersEnabled: true,
      hapticsEnabled: false,
    });
    assert.equal(
      await repo.completeReminder(id, "2026-10-30", "receipt-one", "09:00"),
      true,
    );
    await repo.setCompletion(id, "2026-10-30", false, "2026-10-30");
    assert.equal(
      await repo.completeReminder(id, "2026-10-30", "receipt-one", "09:00"),
      false,
    );
    assert.equal((await repo.snapshot()).completions.length, 0);
    await repo.setArchived(id, true, "2026-10-30");
    assert.equal(
      await repo.completeReminder(id, "2026-10-30", "receipt-two", "09:00"),
      false,
    );
  } finally {
    adapter.close();
  }
});
test("snooze receipts persist the first absolute deadline under replay", async () => {
  const adapter = sqliteAdapter();
  try {
    const repo = new HabitRepository(adapter.db);
    await repo.initialize();
    const first = Date.now() + 600000;
    assert.deepEqual(
      await Promise.all([
        repo.snoozeDeadline("delivery", first),
        repo.snoozeDeadline("delivery", first + 60000),
      ]),
      [first, first],
    );
  } finally {
    adapter.close();
  }
});

test("time-of-day metadata survives reopen without changing history, order or schema", async () => {
  const dir = mkdtempSync(join(tmpdir(), "still-groups-"));
  const path = join(dir, "habits.db");
  let adapter = sqliteAdapter(path);
  try {
    let repo = new HabitRepository(adapter.db);
    await repo.initialize();
    const first = await repo.saveHabit(draft, "2026-10-29");
    const second = await repo.saveHabit(
      { ...draft, name: "Walk", timeOfDay: "evening" },
      "2026-10-29",
    );
    await repo.setCompletion(first, "2026-10-29", true, "2026-10-29");
    await repo.saveHabit(
      { ...draft, timeOfDay: "morning" },
      "2026-10-30",
      first,
    );
    await repo.setArchived(first, true, "2026-10-30");
    await repo.setArchived(first, false, "2026-10-30");
    adapter.close();
    adapter = sqliteAdapter(path);
    repo = new HabitRepository(adapter.db);
    await repo.initialize();
    const snapshot = await repo.snapshot();
    assert.deepEqual(
      snapshot.habits.map((h) => [h.id, h.timeOfDay]),
      [
        [first, "morning"],
        [second, "evening"],
      ],
    );
    assert.deepEqual(
      snapshot.completions.map((c) => ({ ...c })),
      [{ habitId: first, date: "2026-10-29" }],
    );
    assert.equal(
      (
        await adapter.db.getFirstAsync<{ user_version: number }>(
          "PRAGMA user_version",
        )
      )?.user_version,
      1,
    );
    await assert.rejects(
      repo.saveHabit(
        { ...draft, timeOfDay: "bad" as never },
        "2026-10-30",
        first,
      ),
    );
    await repo.deleteHabit(second);
    assert.equal(
      await adapter.db.getFirstAsync(
        "SELECT value FROM settings WHERE key=?",
        `habitTimeOfDay:${second}`,
      ),
      null,
    );
  } finally {
    adapter.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("custom emoji persist through editing and reopening without changing check-ins", async () => {
  const dir = mkdtempSync(join(tmpdir(), "still-emoji-"));
  const path = join(dir, "habits.db");
  let adapter = sqliteAdapter(path);
  try {
    let repo = new HabitRepository(adapter.db);
    await repo.initialize();
    const id = await repo.saveHabit({ ...draft, emoji: " 💊 " }, "2026-10-29");
    assert.equal((await repo.snapshot()).habits[0]?.emoji, "💊");
    await repo.setCompletion(id, "2026-10-29", true, "2026-10-29");
    await repo.saveHabit({ ...draft, emoji: "👩🏽‍⚕️" }, "2026-10-29", id);
    adapter.close();
    adapter = sqliteAdapter(path);
    repo = new HabitRepository(adapter.db);
    await repo.initialize();
    const snapshot = await repo.snapshot();
    assert.equal(snapshot.habits[0]?.emoji, "👩🏽‍⚕️");
    assert.equal(snapshot.completions.length, 1);
    assert.equal(snapshot.completions[0]?.habitId, id);
    assert.equal(snapshot.completions[0]?.date, "2026-10-29");
    await assert.rejects(
      repo.saveHabit({ ...draft, emoji: "💊💊" }, "2026-10-29", id),
    );
    assert.equal((await repo.snapshot()).habits[0]?.emoji, "👩🏽‍⚕️");
  } finally {
    adapter.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("migrations are repeatable and reject newer unknown schemas", async () => {
  const { db, close } = sqliteAdapter();
  const repo = new HabitRepository(db);
  try {
    await repo.initialize();
    await repo.initialize();
    assert.equal((await repo.snapshot()).habits.length, 0);
    await db.execAsync("PRAGMA user_version = 99");
    await assert.rejects(repo.initialize(), /newer/);
  } finally {
    close();
  }
});
test("SQLite persists after reopening and unique check-ins can be unchecked", async () => {
  const dir = mkdtempSync(join(tmpdir(), "still-test-"));
  const path = join(dir, "habits.db");
  let adapter = sqliteAdapter(path);
  try {
    let repo = new HabitRepository(adapter.db);
    await repo.initialize();
    const id = await repo.saveHabit(draft, "2026-10-26");
    await Promise.all([
      repo.setCompletion(id, "2026-10-26", true, "2026-10-27"),
      repo.setCompletion(id, "2026-10-26", true, "2026-10-27"),
    ]);
    adapter.close();
    adapter = sqliteAdapter(path);
    repo = new HabitRepository(adapter.db);
    await repo.initialize();
    assert.equal((await repo.snapshot()).completions.length, 1);
    assert.equal((await repo.snapshot()).habits[0]?.name, "Read");
    await repo.setCompletion(id, "2026-10-26", false, "2026-10-27");
    assert.equal((await repo.snapshot()).completions.length, 0);
  } finally {
    adapter.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("editing, archive periods, restore, and cascading deletion preserve invariants", async () => {
  const { db, close } = sqliteAdapter();
  const repo = new HabitRepository(db);
  try {
    await repo.initialize();
    const id = await repo.saveHabit(draft, "2026-10-19");
    await repo.setCompletion(id, "2026-10-19", true, "2026-10-19");
    await repo.saveHabit(
      { ...draft, name: "Read slowly", weekdays: [1, 3] },
      "2026-10-21",
      id,
    );
    assert.equal((await repo.snapshot()).habits[0]?.schedules.length, 2);
    await repo.setArchived(id, true, "2026-10-21");
    assert.equal((await repo.snapshot()).habits[0]?.archived, true);
    await repo.setArchived(id, false, "2026-10-26");
    assert.equal((await repo.snapshot()).habits[0]?.periods.length, 2);
    await assert.rejects(
      repo.setCompletion(id, "2026-10-23", true, "2026-10-26"),
      /scheduled/,
    );
    await assert.rejects(
      repo.setCompletion(id, "2026-10-28", true, "2026-10-26"),
      /future/i,
    );
    await repo.deleteHabit(id);
    const snapshot = await repo.snapshot();
    assert.equal(snapshot.habits.length, 0);
    assert.equal(snapshot.completions.length, 0);
    assert.equal(
      (
        await db.getFirstAsync<{ n: number }>(
          "SELECT count(*) AS n FROM schedules",
        )
      )?.n,
      0,
    );
  } finally {
    close();
  }
});
test("invalid drafts cannot partially change a habit and settings persist", async () => {
  const { db, close } = sqliteAdapter();
  const repo = new HabitRepository(db);
  try {
    await repo.initialize();
    const id = await repo.saveHabit(draft, "2026-10-26");
    await assert.rejects(
      repo.saveHabit({ ...draft, name: " " }, "2026-10-26", id),
    );
    assert.equal((await repo.snapshot()).habits[0]?.name, "Read");
    await repo.saveSettings({
      theme: "dark",
      remindersEnabled: true,
      hapticsEnabled: false,
    });
    assert.deepEqual((await repo.snapshot()).settings, {
      theme: "dark",
      remindersEnabled: true,
      hapticsEnabled: false,
    });
  } finally {
    close();
  }
});
test("archiving pauses today and restoring after one day does not rewrite the pause", async () => {
  const { db, close } = sqliteAdapter();
  const repo = new HabitRepository(db);
  try {
    await repo.initialize();
    const id = await repo.saveHabit(draft, "2026-10-19");
    await repo.setCompletion(id, "2026-10-19", true, "2026-10-19");
    await repo.setArchived(id, true, "2026-10-20");
    assert.equal(
      isScheduled((await repo.snapshot()).habits[0]!, "2026-10-20"),
      false,
    );
    await repo.setArchived(id, false, "2026-10-21");
    const data = await repo.snapshot();
    assert.equal(isScheduled(data.habits[0]!, "2026-10-20"), false);
    assert.equal(
      habitStats(data.habits[0]!, data.completions, "2026-10-21").currentStreak,
      1,
    );
  } finally {
    close();
  }
});

test("a westward time zone change cannot make archive fail its date constraint", async () => {
  const { db, close } = sqliteAdapter();
  const repo = new HabitRepository(db);
  try {
    await repo.initialize();
    const id = await repo.saveHabit(draft, "2026-10-27");
    await repo.setArchived(id, true, "2026-10-26");
    assert.equal((await repo.snapshot()).habits[0]?.archived, true);
    await repo.setArchived(id, false, "2026-10-26");
    const habit = (await repo.snapshot()).habits[0]!;
    assert.equal(habit.archived, false);
    assert.equal(isScheduled(habit, "2026-10-26"), false);
    assert.equal(isScheduled(habit, "2026-10-27"), true);
  } finally {
    close();
  }
});

test("habit order survives reopening without changing check-ins or settings", async () => {
  const dir = mkdtempSync(join(tmpdir(), "still-order-test-"));
  const path = join(dir, "habits.db");
  let adapter = sqliteAdapter(path);
  try {
    let repo = new HabitRepository(adapter.db);
    await repo.initialize();
    const read = await repo.saveHabit(draft, "2026-10-26");
    const walk = await repo.saveHabit({ ...draft, name: "Walk" }, "2026-10-27");
    const water = await repo.saveHabit(
      { ...draft, name: "Water" },
      "2026-10-27",
    );
    await repo.setCompletion(read, "2026-10-26", true, "2026-10-27");
    const original = (await repo.snapshot()).habits.find((h) => h.id === read);
    await repo.moveHabit(water, "up");
    await repo.moveHabit(water, "up");
    await repo.moveHabit(water, "up");
    await repo.moveHabit(walk, "down");
    await repo.saveSettings({
      theme: "dark",
      remindersEnabled: true,
      hapticsEnabled: false,
    });
    adapter.close();
    adapter = sqliteAdapter(path);
    repo = new HabitRepository(adapter.db);
    await repo.initialize();
    const snapshot = await repo.snapshot();
    assert.deepEqual(
      snapshot.habits.map((h) => h.id),
      [water, read, walk],
    );
    assert.deepEqual(
      snapshot.habits.find((h) => h.id === read),
      original,
    );
    assert.deepEqual(
      snapshot.completions.map((completion) => ({ ...completion })),
      [{ habitId: read, date: "2026-10-26" }],
    );
    assert.deepEqual(snapshot.settings, {
      theme: "dark",
      remindersEnabled: true,
      hapticsEnabled: false,
    });
    assert.equal(
      (
        await adapter.db.getFirstAsync<{ user_version: number }>(
          "PRAGMA user_version",
        )
      )?.user_version,
      1,
    );
  } finally {
    adapter.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("reordering skips archived habits and handles new, restored, and deleted habits", async () => {
  const { db, close } = sqliteAdapter();
  const repo = new HabitRepository(db);
  try {
    await repo.initialize();
    const a = await repo.saveHabit(draft, "2026-10-26");
    const b = await repo.saveHabit({ ...draft, name: "Walk" }, "2026-10-26");
    const c = await repo.saveHabit({ ...draft, name: "Water" }, "2026-10-26");
    await repo.setArchived(b, true, "2026-10-27");
    await assert.rejects(repo.moveHabit(b, "up"), /reorder/i);
    await assert.rejects(repo.moveHabit("missing", "up"), /reorder/i);
    await repo.moveHabit(c, "up");
    const d = await repo.saveHabit({ ...draft, name: "Stretch" }, "2026-10-27");
    assert.deepEqual(
      (await repo.snapshot()).habits.map((h) => h.id),
      [c, b, a, d],
    );
    await repo.setArchived(b, false, "2026-10-27");
    await repo.moveHabit(a, "down");
    await repo.deleteHabit(d);
    assert.deepEqual(
      (await repo.snapshot()).habits.map((h) => h.id),
      [c, b, a],
    );
  } finally {
    close();
  }
});

test("concurrent reorder requests use the latest saved order", async () => {
  const { db, close } = sqliteAdapter();
  const repo = new HabitRepository(db);
  try {
    await repo.initialize();
    const a = await repo.saveHabit(draft, "2026-10-26");
    const b = await repo.saveHabit({ ...draft, name: "Walk" }, "2026-10-26");
    const c = await repo.saveHabit({ ...draft, name: "Water" }, "2026-10-26");
    await Promise.all([repo.moveHabit(c, "up"), repo.moveHabit(c, "up")]);
    assert.deepEqual(
      (await repo.snapshot()).habits.map((h) => h.id),
      [c, a, b],
    );
  } finally {
    close();
  }
});

test("legacy and malformed order metadata never hides or duplicates habits", async () => {
  const { db, close } = sqliteAdapter();
  const repo = new HabitRepository(db);
  try {
    await repo.initialize();
    const b = await repo.saveHabit({ ...draft, name: "Walk" }, "2026-10-27");
    const a = await repo.saveHabit(draft, "2026-10-26");
    const c = await repo.saveHabit({ ...draft, name: "Water" }, "2026-10-27");
    // Version 1 installs made before reordering have no saved order metadata.
    await db.runAsync("DELETE FROM settings WHERE key='habitOrder'");
    assert.deepEqual(
      (await repo.snapshot()).habits.map((h) => h.id),
      [a, b, c],
    );
    for (const value of ["not json", '{"ids":[]}', "null"]) {
      await db.runAsync(
        "INSERT INTO settings(key,value) VALUES ('habitOrder',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        value,
      );
      assert.deepEqual(
        (await repo.snapshot()).habits.map((h) => h.id),
        [a, b, c],
      );
    }
    await db.runAsync(
      "UPDATE settings SET value=? WHERE key='habitOrder'",
      JSON.stringify([c, c, "deleted", a, 42]),
    );
    assert.deepEqual(
      (await repo.snapshot()).habits.map((h) => h.id),
      [c, a, b],
    );
  } finally {
    close();
  }
});

test("new habits append even when the local date moves backward", async () => {
  const { db, close } = sqliteAdapter();
  const repo = new HabitRepository(db);
  try {
    await repo.initialize();
    const a = await repo.saveHabit(draft, "2026-10-26");
    const b = await repo.saveHabit({ ...draft, name: "Walk" }, "2026-10-26");
    await repo.moveHabit(b, "up");
    const c = await repo.saveHabit({ ...draft, name: "Water" }, "2026-10-28");
    const d = await repo.saveHabit({ ...draft, name: "Stretch" }, "2026-10-27");
    assert.deepEqual(
      (await repo.snapshot()).habits.map((habit) => habit.id),
      [b, a, c, d],
    );
  } finally {
    close();
  }
});

test("check-in vibration defaults off and persists without a schema change", async () => {
  const { db, close } = sqliteAdapter();
  const repo = new HabitRepository(db);
  try {
    await repo.initialize();
    assert.equal((await repo.snapshot()).settings.hapticsEnabled, false);
    await repo.saveSettings({
      theme: "system",
      remindersEnabled: false,
      hapticsEnabled: true,
    });
    await repo.initialize();
    assert.equal((await repo.snapshot()).settings.hapticsEnabled, true);
    assert.equal(
      (await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))
        ?.user_version,
      1,
    );
  } finally {
    close();
  }
});

test("check-in mutations report actual changes rather than duplicate requests", async () => {
  const { db, close } = sqliteAdapter();
  const repo = new HabitRepository(db);
  try {
    await repo.initialize();
    const id = await repo.saveHabit(draft, "2026-10-28");
    assert.equal(
      await repo.setCompletion(id, "2026-10-28", true, "2026-10-28"),
      true,
    );
    assert.equal(
      await repo.setCompletion(id, "2026-10-28", true, "2026-10-28"),
      false,
    );
    assert.equal(
      await repo.setCompletion(id, "2026-10-28", false, "2026-10-28"),
      true,
    );
    assert.equal(
      await repo.setCompletion(id, "2026-10-28", false, "2026-10-28"),
      false,
    );
  } finally {
    close();
  }
});

test("a check-in returns its saved snapshot without a second database read", async () => {
  const { db, close } = sqliteAdapter();
  let saved = false;
  const repo = new HabitRepository({
    ...db,
    async runAsync(sql, ...params) {
      const result = await db.runAsync(sql, ...params);
      if (sql.includes("INTO completions") || sql.includes("FROM completions"))
        saved = true;
      return result;
    },
    async getAllAsync<T>(sql: string, ...params: SqlParam[]) {
      assert.equal(
        saved,
        false,
        "A saved check-in should already have its snapshot",
      );
      return db.getAllAsync<T>(sql, ...params);
    },
  });
  try {
    const today = "2026-10-28";
    await repo.initialize();
    const id = await repo.saveHabit(draft, today);
    const completed = await repo.setCompletionAndSnapshot(
      id,
      today,
      true,
      today,
    );
    assert.equal(completed.changed, true);
    assert.deepEqual(completed.snapshot.completions, [
      { habitId: id, date: today },
    ]);
    saved = false;
    const undone = await repo.setCompletionAndSnapshot(id, today, false, today);
    assert.equal(undone.changed, true);
    assert.deepEqual(undone.snapshot.completions, []);
    assert.deepEqual(undone.snapshot.habits, completed.snapshot.habits);
  } finally {
    close();
  }
});
