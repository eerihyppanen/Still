import test from "node:test";
import assert from "node:assert/strict";
import {
  runReminderAction,
  parseReminderResponse,
  snoozeIsCurrent,
  SNOOZE_PREFIX,
  type ReminderActionDriver,
  reconcileSnoozes,
} from "../src/notifications/actions";
import type { Habit, Snapshot } from "../src/domain/models";
import { dateKey } from "../src/domain/dates";

const now = new Date(2026, 9, 30, 10, 0).getTime();
const habit: Habit = {
  id: "h",
  name: "Read",
  emoji: "📖",
  color: "#6B56BB",
  description: "",
  createdDate: "2026-10-29",
  archived: false,
  reminderTime: "09:00",
  schedules: [{ effectiveDate: "2026-10-29", weekdays: [0, 1, 2, 3, 4, 5, 6] }],
  periods: [{ startDate: "2026-10-29", endDate: null }],
};
function setup() {
  const snapshot: Snapshot = {
    habits: [habit],
    completions: [],
    settings: {
      theme: "system",
      remindersEnabled: true,
      hapticsEnabled: false,
    },
  };
  const effects: string[] = [];
  const snoozes = new Map<string, number>();
  const receipts = new Map<string, number>();
  const driver: ReminderActionDriver = {
    snapshot: async () => snapshot,
    complete: async (id, date) => {
      if (
        !snapshot.completions.some((c) => c.habitId === id && c.date === date)
      )
        snapshot.completions.push({ habitId: id, date });
      effects.push("complete");
    },
    snooze: async (plan) => {
      const fireAt = receipts.get(plan.receipt) ?? plan.fireAt;
      receipts.set(plan.receipt, fireAt);
      snoozes.set(plan.id, fireAt);
    },
    cancelSnoozes: async () => {
      snoozes.clear();
      effects.push("cancel");
    },
    dismiss: async () => {
      effects.push("dismiss");
    },
  };
  return { snapshot, effects, driver, snoozes };
}
const action = {
  action: "done" as const,
  habitId: "h",
  date: dateKey(new Date(now)),
  notificationId: "still:h:daily",
  receipt: "one-delivery",
};

test("raw Android headless action payloads decode dataString and reject malformed data", () => {
  const raw = {
    actionIdentifier: "stillDone",
    notification: {
      date: now,
      request: {
        identifier: "still:h:daily",
        content: {
          dataString: JSON.stringify({ habitId: "h", reminderTime: "09:00" }),
        },
      },
    },
  };
  assert.equal(parseReminderResponse(raw)?.habitId, "h");
  const malformed = {
    ...raw,
    notification: {
      ...raw.notification,
      request: {
        ...raw.notification.request,
        content: { dataString: "{broken" },
      },
    },
  };
  assert.equal(parseReminderResponse(malformed), null);
});
test("a recurring reminder delivered after midnight retains the last scheduled occurrence", () => {
  const response = {
    actionIdentifier: "stillDone",
    notification: {
      date: new Date(2026, 9, 31, 0, 5).getTime(),
      request: {
        identifier: "still:h:daily",
        content: {
          data: { habitId: "h", reminderTime: "23:55", scheduleWeekday: null },
        },
      },
    },
  };
  assert.equal(parseReminderResponse(response)?.date, "2026-10-30");
  const weekly = {
    ...response,
    notification: {
      ...response.notification,
      date: new Date(2026, 10, 1, 10, 0).getTime(),
      request: {
        ...response.notification.request,
        identifier: "still:h:6",
        content: {
          data: { habitId: "h", reminderTime: "09:00", scheduleWeekday: 6 },
        },
      },
    },
  };
  assert.equal(parseReminderResponse(weekly)?.date, "2026-10-30");
});
test("in-app completion or disabling clears delivered snoozes without touching unrelated notifications", async () => {
  const d = setup();
  d.snapshot.completions.push({ habitId: "h", date: "2026-10-30" });
  const cancelled: string[] = [],
    dismissed: string[] = [];
  const data = { habitId: "h", date: "2026-10-30", reminderTime: "09:00" };
  await reconcileSnoozes(
    {
      scheduled: async () => [
        { id: `${SNOOZE_PREFIX}h:2026-10-30`, data },
        { id: "still-test-reminder", data },
      ],
      presented: async () => [
        { id: `${SNOOZE_PREFIX}h:2026-10-30`, data },
        { id: "still:h:daily", data },
      ],
      cancel: async (id) => {
        cancelled.push(id);
      },
      dismiss: async (id) => {
        dismissed.push(id);
      },
    },
    d.snapshot,
    "2026-10-30",
  );
  assert.deepEqual(cancelled, [`${SNOOZE_PREFIX}h:2026-10-30`]);
  assert.deepEqual(dismissed, [`${SNOOZE_PREFIX}h:2026-10-30`]);
});

test("Done is idempotent and removes snoozes only after the completion saves", async () => {
  const d = setup();
  await runReminderAction(action, d.driver, now);
  await runReminderAction(action, d.driver, now);
  assert.deepEqual(d.snapshot.completions, [
    { habitId: "h", date: "2026-10-30" },
  ]);
  assert.deepEqual(d.effects.slice(0, 3), ["complete", "cancel", "dismiss"]);
});
test("failed completion is not dismissed or reported as complete", async () => {
  const d = setup();
  d.driver.complete = async () => {
    throw new Error("disk full");
  };
  await assert.rejects(runReminderAction(action, d.driver, now), /disk full/);
  assert.equal(d.effects.length, 0);
});
test("yesterday's notification cannot cancel today's valid snooze", async () => {
  const d = setup();
  d.snoozes.set(`${SNOOZE_PREFIX}h:2026-10-30`, now + 600000);
  await runReminderAction({ ...action, date: "2026-10-29" }, d.driver, now);
  assert.equal(d.snoozes.size, 1);
});
test("a snooze cannot roll yesterday's occurrence into tomorrow", async () => {
  const d = setup();
  await assert.rejects(
    runReminderAction(
      { ...action, action: "snooze" },
      d.driver,
      new Date(2026, 9, 30, 23, 55).getTime(),
    ),
    /tomorrow/,
  );
  assert.equal(d.snoozes.size, 0);
});

test("a previously delivered reminder cannot snooze a weekly goal that is now met", async () => {
  const { snapshot, driver, snoozes } = setup();
  snapshot.habits = [{
    ...habit,
    schedules: [{ effectiveDate: habit.createdDate, weekdays: [], weeklyTarget: 1 }],
  }];
  snapshot.completions = [{ habitId: habit.id, date: "2026-10-29" }];
  assert.equal(await runReminderAction({ ...action, action: "snooze" }, driver, now), "ignored");
  assert.equal(snoozes.size, 0);
});
test("Snooze is a single ten-minute request and replay keeps its first deadline", async () => {
  const d = setup();
  const snooze = { ...action, action: "snooze" as const };
  await runReminderAction(snooze, d.driver, now);
  await runReminderAction(snooze, d.driver, now + 60000);
  assert.deepEqual(
    [...d.snoozes],
    [[`${SNOOZE_PREFIX}h:2026-10-30`, now + 600000]],
  );
  assert.equal(d.snapshot.completions.length, 0);
});
test("stale, disabled, deleted, archived, unscheduled and completed notifications cannot snooze", async () => {
  for (const mode of [
    "stale",
    "disabled",
    "deleted",
    "archived",
    "unscheduled",
    "completed",
  ]) {
    const d = setup();
    if (mode === "disabled") d.snapshot.settings.remindersEnabled = false;
    if (mode === "deleted") d.snapshot.habits = [];
    if (mode === "archived") d.snapshot.habits = [{ ...habit, archived: true }];
    if (mode === "unscheduled")
      d.snapshot.habits = [
        {
          ...habit,
          schedules: [{ effectiveDate: "2026-10-29", weekdays: [1] }],
        },
      ];
    if (mode === "completed")
      d.snapshot.completions.push({ habitId: "h", date: "2026-10-30" });
    const result = await runReminderAction(
      {
        ...action,
        action: "snooze",
        date: mode === "stale" ? "2026-10-29" : action.date,
      },
      d.driver,
      now,
    );
    assert.equal(result, "ignored", mode);
    assert.equal(d.snoozes.size, 0, mode);
  }
});
test("snoozes stop being valid after completion, deletion, archive or reminders-off", () => {
  const d = setup();
  const request = { habitId: "h", date: "2026-10-30", reminderTime: "09:00" };
  assert.equal(snoozeIsCurrent(request, d.snapshot, "2026-10-30"), true);
  assert.equal(snoozeIsCurrent(request, d.snapshot, "2026-10-31"), false);
  for (const patch of [
    { habits: [] },
    { habits: [{ ...habit, archived: true }] },
    { completions: [{ habitId: "h", date: "2026-10-30" }] },
    { settings: { ...d.snapshot.settings, remindersEnabled: false } },
  ])
    assert.equal(
      snoozeIsCurrent(request, { ...d.snapshot, ...patch }, "2026-10-30"),
      false,
    );
});
test("notification parsing accepts only owned habit actions and preserves the occurrence date", () => {
  const response = {
    actionIdentifier: "stillDone",
    notification: {
      date: now,
      request: {
        identifier: "still:h:daily",
        content: { data: { habitId: "h" } },
      },
    },
  };
  assert.equal(parseReminderResponse(response)?.date, "2026-10-30");
  assert.equal(
    parseReminderResponse({ ...response, actionIdentifier: "other" }),
    null,
  );
  assert.equal(
    parseReminderResponse({
      ...response,
      notification: {
        ...response.notification,
        request: {
          identifier: "still-test-reminder",
          content: { data: { habitId: "h" } },
        },
      },
    }),
    null,
  );
  assert.equal(
    parseReminderResponse({
      ...response,
      notification: {
        ...response.notification,
        request: {
          identifier: "still:h:daily",
          content: { data: { habitId: "different" } },
        },
      },
    }),
    null,
  );
});
