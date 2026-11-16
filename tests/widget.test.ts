import test from "node:test";
import assert from "node:assert/strict";
import { buildWidgetSnapshot } from "../src/widgets/snapshot";
import type { Habit, Snapshot } from "../src/domain/models";

const habit = (id: string, timeOfDay?: Habit["timeOfDay"]): Habit => ({
  id,
  name: `Habit ${id}`,
  emoji: "🌱",
  color: "#6B56BB",
  description: "",
  archived: false,
  createdDate: "2026-10-29",
  schedules: [{ effectiveDate: "2026-10-29", weekdays: [5] }],
  periods: [{ startDate: "2026-10-29", endDate: null }],
  reminderTime: null,
  timeOfDay,
});
const snapshot: Snapshot = {
  habits: [],
  completions: [],
  settings: { theme: "system", remindersEnabled: false, hapticsEnabled: false },
};
test("widget has a visible calendar date and an honest empty state", () => {
  const value = buildWidgetSnapshot(snapshot, "2026-10-30");
  assert.match(value.dateLabel, /Oct/);
  assert.match(value.dateLabel, /30/);
  assert.equal(value.progress, "No habits planned");
  assert.deepEqual(value.rows, []);
});
test("widget uses scheduled active habits, real completions and group order", () => {
  const value = buildWidgetSnapshot(
    {
      ...snapshot,
      habits: [
        habit("e", "evening"),
        habit("m", "morning"),
        { ...habit("archived"), archived: true },
        habit("u"),
      ],
      completions: [{ habitId: "m", date: "2026-10-30" }],
    },
    "2026-10-30",
  );
  assert.equal(value.progress, "1 of 3 complete");
  assert.deepEqual(value.rows, [
    "☐ 🌱 Habit e",
    "☐ 🌱 Habit u",
    "✓ 🌱 Habit m",
  ]);
  assert.equal(
    buildWidgetSnapshot({ ...snapshot, habits: [habit("h")] }, "2026-10-31")
      .progress,
    "No habits planned",
  );
});
test("widget bounds its list and names without changing the habit's saved name", () => {
  const habits = Array.from({ length: 6 }, (_, i) => ({
    ...habit(String(i)),
    name: "A".repeat(80),
  }));
  const value = buildWidgetSnapshot({ ...snapshot, habits }, "2026-10-30");
  assert.equal(value.rows.length, 3);
  assert.equal(value.more, "+3 more in Still");
  assert.ok(value.rows.every((row) => row.length < 55));
  assert.equal(habits[0]!.name.length, 80);
});

test("met weekly goals cannot crowd habits that still need a check-in out of the widget", () => {
  const weekly = (id: string): Habit => ({
    ...habit(id, "morning"),
    schedules: [{ effectiveDate: "2026-10-29", weekdays: [], weeklyTarget: 1 }],
  });
  const value = buildWidgetSnapshot({
    ...snapshot,
    habits: [weekly("met1"), weekly("met2"), weekly("met3"), weekly("open"), habit("daily")],
    completions: ["met1", "met2", "met3"].map((id) => ({ habitId: id, date: "2026-10-29" })),
  }, "2026-10-30");
  assert.deepEqual(value.rows, [
    "☐ 🌱 Habit daily",
    "☐ 🌱 Habit open · 0/1 this week",
    "✓ 🌱 Habit met1 · 1/1 this week",
  ]);
});
