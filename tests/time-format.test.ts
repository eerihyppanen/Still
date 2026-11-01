import test from "node:test";
import assert from "node:assert/strict";
import { formatReminderTime } from "../src/domain/time-format";

test("24-hour display preserves midnight and late-night times", () => {
  assert.equal(formatReminderTime("00:05", true, "en-US"), "00:05");
  assert.equal(formatReminderTime("23:59", true, "en-US"), "23:59");
});
test("12-hour display distinguishes midnight, noon, and evening", () => {
  assert.equal(formatReminderTime("00:05", false, "en-US"), "12:05 AM");
  assert.equal(formatReminderTime("12:00", false, "en-US"), "12:00 PM");
  assert.equal(formatReminderTime("21:15", false, "en-US"), "9:15 PM");
});
test("invalid browser input stays editable rather than breaking formatting", () => {
  assert.equal(formatReminderTime("09:", true, "en-US"), "09:");
  assert.equal(formatReminderTime("25:99", false, "en-US"), "25:99");
});
