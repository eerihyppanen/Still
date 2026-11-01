import test from "node:test";
import assert from "node:assert/strict";
import { getDraftErrors, validateDraft } from "../src/domain/habits";
import { isDraftDirty } from "../src/domain/drafts";
import type { HabitDraft } from "../src/domain/models";

const draft: HabitDraft = {
  name: "Read",
  description: "A few pages",
  emoji: "📖",
  color: "#6B56BB",
  weekdays: [1, 3, 5],
  reminderTime: null,
};

test("field validation reports every invalid field together", () => {
  const errors = getDraftErrors({
    ...draft,
    name: " ",
    description: "x".repeat(501),
    weekdays: [],
    reminderTime: "25:00",
  });
  assert.deepEqual(Object.keys(errors).sort(), [
    "description",
    "name",
    "reminderTime",
    "weekdays",
  ]);
  assert.match(errors.name!, /name/);
  assert.match(errors.weekdays!, /day/);
  assert.throws(() => validateDraft({ ...draft, name: " " }), /name/);
  assert.deepEqual(getDraftErrors(draft), {});
});

test("normalized whitespace and weekday ordering do not create false dirty drafts", () => {
  assert.equal(
    isDraftDirty(draft, {
      ...draft,
      name: " Read ",
      description: " A few pages ",
      weekdays: [5, 1, 3, 3],
    }),
    false,
  );
});

test("all persisted form fields trigger protection and reverting removes it", () => {
  const changes: Partial<HabitDraft>[] = [
    { name: "Walk" },
    { description: "Outside" },
    { emoji: "🚶" },
    { color: "#367C74" },
    { weekdays: [1] },
    { reminderTime: "09:00" },
  ];
  for (const change of changes) {
    assert.equal(isDraftDirty(draft, { ...draft, ...change }), true);
  }
  assert.equal(isDraftDirty(draft, { ...draft }), false);
});

test("invalid reminder text still counts as an unsaved change without throwing", () => {
  assert.equal(isDraftDirty(draft, { ...draft, reminderTime: "bad" }), true);
});

test("habit icons reject text, incomplete sequences and multiple emoji", () => {
  for (const emoji of ["", "   ", "pill", "💊💊", "a💊", "💊\n💧", "👩‍", "🇫"]) {
    assert.ok(getDraftErrors({ ...draft, emoji }).emoji, emoji);
    assert.throws(() => validateDraft({ ...draft, emoji }), emoji);
  }
});

test("one custom emoji accepts complete multi-code-point sequences", () => {
  for (const emoji of ["💊", "🦋", "👍🏽", "🇫🇮", "👩🏽‍⚕️", "👨‍👩‍👧‍👦", "1️⃣", "❤️", "✍️"]) {
    assert.deepEqual(getDraftErrors({ ...draft, emoji }), {}, emoji);
    assert.equal(validateDraft({ ...draft, emoji }).emoji, emoji);
  }
});

test("custom emoji trims surrounding whitespace for saving and dirty comparison", () => {
  assert.equal(validateDraft({ ...draft, emoji: " 🦋 " }).emoji, "🦋");
  assert.equal(isDraftDirty({ ...draft, emoji: "🦋" }, { ...draft, emoji: " 🦋 " }), false);
});
