import test from "node:test";
import assert from "node:assert/strict";
import { groupTodayHabits } from "../src/domain/groups";
import { isDraftDirty } from "../src/domain/drafts";
import { getDraftErrors } from "../src/domain/habits";
import type { Habit, HabitDraft } from "../src/domain/models";

const draft: HabitDraft = {
  name: "Read",
  emoji: "📖",
  color: "#6B56BB",
  description: "",
  weekdays: [5],
  reminderTime: null,
};
const habit = (id: string, timeOfDay?: Habit["timeOfDay"]): Habit => ({
  ...draft,
  id,
  createdDate: "2026-10-30",
  archived: false,
  schedules: [],
  periods: [],
  timeOfDay,
});

test("old ungrouped habits keep one Today list in their custom order", () => {
  const habits = [habit("b"), habit("a")];
  assert.deepEqual(groupTodayHabits(habits), [
    { key: "anytime", title: "Today’s habits", habits },
  ]);
});
test("time groups keep the relative custom order and omit empty groups", () => {
  const habits = [
    habit("e", "evening"),
    habit("m2", "morning"),
    habit("u"),
    habit("m1", "morning"),
  ];
  assert.deepEqual(
    groupTodayHabits(habits).map((g) => [g.title, g.habits.map((h) => h.id)]),
    [
      ["Morning", ["m2", "m1"]],
      ["Evening", ["e"]],
      ["Anytime", ["u"]],
    ],
  );
});
test("time assignment participates in validation and unsaved-change detection", () => {
  assert.equal(isDraftDirty(draft, { ...draft, timeOfDay: "anytime" }), false);
  assert.equal(isDraftDirty(draft, { ...draft, timeOfDay: "morning" }), true);
  assert.match(
    getDraftErrors({ ...draft, timeOfDay: "bad" as never }).timeOfDay!,
    /time of day/i,
  );
});
