import test from "node:test";
import assert from "node:assert/strict";
import { getHabitReminderFeedback } from "../src/notifications/habit-reminder-status";

test("an enabled reminder system does not describe an unsaved draft as scheduled", () => {
  const result = getHabitReminderFeedback(
    { state: "ready", message: "Ready" },
    true,
  );
  assert.match(result.message, /enabled/i);
  assert.match(result.message, /save this habit/i);
  assert.equal(result.needsSettings, false);
});

test("global off overrides a stale ready status and gives a recovery action", () => {
  const result = getHabitReminderFeedback(
    { state: "ready", message: "Ready" },
    false,
  );
  assert.match(result.message, /off in Still/);
  assert.match(result.message, /save/i);
  assert.equal(result.needsSettings, true);
});

test("blocked permission and scheduling failures offer settings recovery", () => {
  for (const state of ["denied", "error"] as const) {
    const result = getHabitReminderFeedback(
      { state, message: "Details" },
      true,
    );
    assert.match(
      result.message,
      state === "denied"
        ? /blocked.*device settings/i
        : /could not be checked or updated/i,
    );
    assert.equal(result.needsSettings, true);
    assert.doesNotMatch(result.message, /are enabled/i);
  }
});

test("browser reminder feedback points to mobile rather than unavailable settings", () => {
  const result = getHabitReminderFeedback(
    { state: "unsupported", message: "Mobile only" },
    false,
  );
  assert.match(result.message, /Android and iOS/);
  assert.equal(result.needsSettings, false);
});

test("checking and archived states never claim an active reminder", () => {
  const checking = getHabitReminderFeedback(
    { state: "off", message: "Old status" },
    true,
  );
  assert.match(checking.message, /checking/i);
  assert.equal(checking.needsSettings, false);
  const archived = getHabitReminderFeedback(
    { state: "ready", message: "Ready" },
    true,
    true,
  );
  assert.match(archived.message, /restore this habit/i);
  assert.equal(archived.needsSettings, false);
});
