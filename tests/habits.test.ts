import test from "node:test";
import assert from "node:assert/strict";
import {
  isScheduled,
  habitStats,
  summarize,
  validateDraft,
} from "../src/domain/habits";
import type { Habit, HabitDraft, Completion } from "../src/domain/models";

const habit: Habit = {
  id: "h",
  name: "Walk",
  emoji: "🌱",
  color: "#6B56BB",
  description: "",
  createdDate: "2026-10-19",
  archived: false,
  schedules: [{ effectiveDate: "2026-10-19", weekdays: [1, 3, 5] }],
  periods: [{ startDate: "2026-10-19", endDate: null }],
  reminderTime: null,
};
const done = (...dates: string[]): Completion[] =>
  dates.map((date) => ({ habitId: "h", date }));
test("weekly goals end the current streak and preserve the historical longest", () => {
  const switched: Habit = { ...habit, schedules: [
    ...habit.schedules,
    { effectiveDate: "2026-10-22", weekdays: [], weeklyTarget: 2 },
    { effectiveDate: "2026-11-16", weekdays: [1, 3, 5] },
  ] };
  const records = done("2026-10-19", "2026-10-21", "2026-11-16");
  for (const [date, current] of [["2026-11-12", 0], ["2026-11-16", 1]] as const) {
    const stats = habitStats(switched, records, date);
    assert.equal(stats.currentStreak, current);
    assert.equal(stats.longestStreak, 2);
  }
});
test("scheduled weekdays exclude days before creation and rest days", () => {
  assert.equal(isScheduled(habit, "2026-10-16"), false);
  assert.equal(isScheduled(habit, "2026-10-20"), false);
  assert.equal(isScheduled(habit, "2026-10-21"), true);
});
test("unscheduled days and an unfinished today do not break a streak", () => {
  const records = done("2026-10-19", "2026-10-21", "2026-10-23");
  assert.equal(habitStats(habit, records, "2026-10-26").currentStreak, 3);
  assert.equal(habitStats(habit, records, "2026-10-25").currentStreak, 3);
  assert.equal(habitStats(habit, records, "2026-10-27").currentStreak, 0);
});
test("longest streak survives a missed scheduled day and duplicate inputs", () => {
  const stats = habitStats(
    habit,
    done("2026-10-19", "2026-10-19", "2026-10-21", "2026-10-26"),
    "2026-10-26",
  );
  assert.equal(stats.longestStreak, 2);
  assert.equal(stats.currentStreak, 1);
  assert.equal(stats.totalCompleted, 3);
  assert.equal(stats.completionRate, 75);
});
test("schedule edits preserve past schedule eligibility", () => {
  const edited: Habit = {
    ...habit,
    schedules: [
      ...habit.schedules,
      { effectiveDate: "2026-10-26", weekdays: [2, 4] },
    ],
  };
  assert.equal(isScheduled(edited, "2026-10-23"), true);
  assert.equal(isScheduled(edited, "2026-10-26"), false);
  assert.equal(isScheduled(edited, "2026-10-27"), true);
});
test("archive pauses do not count as missed scheduled days", () => {
  const paused: Habit = {
    ...habit,
    periods: [
      { startDate: "2026-10-19", endDate: "2026-10-21" },
      { startDate: "2026-10-26", endDate: null },
    ],
  };
  assert.equal(isScheduled(paused, "2026-10-23"), false);
  assert.equal(
    habitStats(
      paused,
      done("2026-10-19", "2026-10-21", "2026-10-26"),
      "2026-10-26",
    ).currentStreak,
    3,
  );
});
test("completion rates ignore future and unrelated records and preserve real check-ins after schedule edits", () => {
  const edited: Habit = {
    ...habit,
    schedules: [{ effectiveDate: "2026-10-19", weekdays: [3] }],
  };
  const stats = habitStats(
    edited,
    [
      ...done("2026-10-19", "2026-10-21", "2026-11-04"),
      { habitId: "other", date: "2026-10-20" },
    ],
    "2026-10-21",
  );
  assert.equal(stats.totalCompleted, 2);
  assert.equal(stats.completionRate, 100);
});
test("empty aggregates return honest zeroes", () => {
  assert.deepEqual(summarize([], [], ["2026-10-27"], "2026-10-27"), {
    completed: 0,
    scheduled: 0,
    rate: 0,
  });
});
test("draft validation trims names and rejects invalid schedules and times", () => {
  const draft: HabitDraft = {
    name: " Walk ",
    emoji: "🌱",
    color: "#6B56BB",
    description: "",
    weekdays: [1],
    reminderTime: "09:30",
  };
  assert.equal(validateDraft(draft).name, "Walk");
  assert.throws(() => validateDraft({ ...draft, name: " " }));
  assert.throws(() => validateDraft({ ...draft, weekdays: [] }));
  assert.throws(() => validateDraft({ ...draft, reminderTime: "25:99" }));
});
