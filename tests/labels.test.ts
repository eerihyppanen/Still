import test from "node:test";
import assert from "node:assert/strict";
import { streakLabel } from "../src/domain/labels";

test("zero streaks invite a fresh start", () => {
  assert.equal(streakLabel(0), "Start today");
});

test("streak labels read naturally for one or multiple scheduled days", () => {
  assert.equal(streakLabel(1), "1-day streak");
  assert.equal(streakLabel(7), "7-day streak");
});
