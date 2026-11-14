import test from "node:test";
import assert from "node:assert/strict";
import { dailyProgress, todayHabits, weeklyRecap } from "../src/domain/history";
import { summarize } from "../src/domain/habits";
import type { Habit, Completion } from "../src/domain/models";
const h: Habit = {
  id: "h",
  name: "Water",
  emoji: "💧",
  color: "#367C74",
  description: "",
  createdDate: "2026-10-26",
  archived: false,
  schedules: [{ effectiveDate: "2026-10-26", weekdays: [1, 2, 3, 4, 5] }],
  periods: [{ startDate: "2026-10-26", endDate: null }],
  reminderTime: null,
};
const records: Completion[] = [{ habitId: "h", date: "2026-10-26" }];
test("weekly recap keeps historical check-ins and ranks consistency by completion rate", () => {
  const archived: Habit = {
    ...h,
    id: "read",
    name: "Read",
    archived: true,
    schedules: [{ effectiveDate: "2026-10-26", weekdays: [1] }],
    periods: [{ startDate: "2026-10-26", endDate: "2026-10-27" }],
  };
  const recap = weeklyRecap(
    [h, archived],
    [
      ...records,
      ...records,
      { habitId: "read", date: "2026-10-26" },
      { habitId: "h", date: "2026-10-30" },
    ],
    "2026-10-28",
  );
  assert.deepEqual(recap.total, { completed: 2, scheduled: 4, rate: 50 });
  assert.equal(recap.mostConsistent?.habit.id, "read");
  assert.deepEqual(
    recap.hardestDays.map((day) => day.date),
    ["2026-10-27"],
  );
});

test("hardest days exclude rest days and today, and keep ties in calendar order", () => {
  const recap = weeklyRecap([h], records, "2026-11-01");
  assert.deepEqual(
    recap.hardestDays.map((day) => day.date),
    ["2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"],
  );
  const firstDay = weeklyRecap([h], [], "2026-10-26");
  assert.deepEqual(firstDay.hardestDays, []);
  assert.equal(firstDay.mostConsistent, undefined);
});
test("daily progress uses actual check-ins and marks future dates as having no results", () => {
  assert.deepEqual(
    dailyProgress(
      [h],
      records,
      ["2026-10-26", "2026-10-27", "2026-10-28"],
      "2026-10-27",
    ),
    [
      { date: "2026-10-26", completed: 1, scheduled: 1, rate: 100 },
      { date: "2026-10-27", completed: 0, scheduled: 1, rate: 0 },
      { date: "2026-10-28", completed: 0, scheduled: 0, rate: 0 },
    ],
  );
});
test("aggregate rates use scheduled check-ins as denominator rather than averaging percentages", () => {
  const other: Habit = {
    ...h,
    id: "b",
    schedules: [{ effectiveDate: "2026-10-26", weekdays: [1] }],
  };
  assert.deepEqual(
    summarize([h, other], records, ["2026-10-26", "2026-10-27"], "2026-10-27"),
    { completed: 1, scheduled: 3, rate: 33 },
  );
});
test("archived habits never contribute to Today even if they have a check-in today", () => {
  assert.equal(
    todayHabits([{ ...h, archived: true }], records, "2026-10-26").length,
    0,
  );
  assert.equal(todayHabits([h], records, "2026-10-26").length, 1);
  assert.equal(todayHabits([h], records, "2026-10-25").length, 0);
});

test("a paused habit keeps today's saved check-in visible until it is undone", () => {
  const paused: Habit = {
    ...h,
    schedules: [{ effectiveDate: "2026-10-26", weekdays: [], weeklyTarget: 3 }],
    periods: [
      { startDate: "2026-10-26", endDate: "2026-10-26" },
      { startDate: "2026-11-04", endDate: null },
    ],
  };
  assert.deepEqual(todayHabits([paused], records, "2026-10-26"), [paused]);
  assert.deepEqual(todayHabits([paused], [], "2026-10-26"), []);
  assert.deepEqual(todayHabits([paused], records, "2026-10-27"), []);
  const recap = weeklyRecap([paused], records, "2026-10-26");
  assert.equal(recap.total.scheduled, 0);
  assert.deepEqual(recap.weeklyGoals, [{ habit: paused, completed: 1, target: 1 }]);
});

test("the recap shows a capped goal when a pause ends later this week", () => {
  const paused: Habit = {
    ...h,
    schedules: [{ effectiveDate: "2026-10-26", weekdays: [], weeklyTarget: 5 }],
    periods: [
      { startDate: "2026-10-26", endDate: "2026-10-31" },
      { startDate: "2026-11-06", endDate: null },
    ],
  };
  const recap = weeklyRecap([paused], [], "2026-11-03");
  assert.deepEqual(recap.weeklyGoals, [{ habit: paused, completed: 0, target: 3 }]);
});

test("the day before a saved pause remains eligible if the local date moves back", () => {
  const habit: Habit = {
    ...h,
    periods: [
      { startDate: "2026-10-26", endDate: "2026-10-27" },
      { startDate: "2026-11-06", endDate: null },
    ],
  };
  assert.deepEqual(todayHabits([habit], [], "2026-10-26"), [habit]);
  assert.deepEqual(todayHabits([habit], [], "2026-10-27"), []);
});
