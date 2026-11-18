import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReminderPlan,
  reconcileReminders,
  type ReminderDriver,
  type ReminderPlan,
  type ScheduledReminder,
} from "../src/notifications/reminders";
import type { Completion, Habit } from "../src/domain/models";
const habit: Habit = {
  id: "h",
  name: "Read",
  emoji: "📖",
  color: "#6B56BB",
  description: "",
  createdDate: "2026-10-26",
  archived: false,
  reminderTime: "09:30",
  schedules: [{ effectiveDate: "2026-10-26", weekdays: [1, 3] }],
  periods: [{ startDate: "2026-10-26", endDate: null }],
};
test("moving back before a pause preserves eligible reminders on either side of the gap", () => {
  const paused: Habit = { ...habit, periods: [
    { startDate: habit.createdDate, endDate: "2026-10-29" },
    { startDate: "2026-11-04", endDate: null },
  ] };
  for (const native of [true, false]) {
    const plans = buildReminderPlan([paused], "2026-10-26", "UTC", [], native, new Date(2026, 9, 26, 8));
    assert.deepEqual(plans.filter(p => p.occurrenceDate && p.occurrenceDate < "2026-11-04")
      .map(p => p.occurrenceDate), ["2026-10-26", "2026-10-28"]);
    assert.ok(plans.some(p => (p.startsOn ?? p.occurrenceDate) === "2026-11-04"));
    const later = buildReminderPlan([paused], "2026-10-26", "UTC", [], native, new Date(2026, 9, 26, 10));
    assert.ok(!later.some(p => p.occurrenceDate === "2026-10-26"));
  }
});
function driver() {
  const scheduled = new Map<string, ScheduledReminder>();
  let fail = false;
  const os: ReminderDriver = {
    async list() {
      return [...scheduled.values()];
    },
    async cancel(id) {
      scheduled.delete(id);
    },
    async schedule(plan: ReminderPlan) {
      if (fail) throw new Error("OS scheduling unavailable");
      scheduled.set(plan.id, { id: plan.id, signature: plan.signature });
    },
  };
  return {
    scheduled,
    os,
    fail: () => {
      fail = true;
    },
  };
}
test("pausing cancels recurring reminders and schedules the first weekday back", async () => {
  const { os, scheduled } = driver();
  const today = "2026-10-27";
  await reconcileReminders(os, buildReminderPlan([habit], today, "UTC"), true);
  const paused = { ...habit, periods: [
    { startDate: habit.createdDate, endDate: today },
    { startDate: "2026-10-30", endDate: null },
  ] };
  const plan = buildReminderPlan([paused], today, "UTC");
  assert.equal(plan.length, 1);
  assert.equal(plan[0]?.occurrenceDate, "2026-11-02");
  await reconcileReminders(os, plan, true);
  assert.deepEqual([...scheduled.keys()], ["still:h:resume"]);
  await reconcileReminders(os, buildReminderPlan([paused], "2026-11-02", "UTC"), true);
  assert.deepEqual([...scheduled.keys()], ["still:h:2", "still:h:4"]);
});
test("reaching a weekly goal swaps daily reminders for one next Monday, and undo restores them", async () => {
  const { os, scheduled } = driver();
  const weekly: Habit = {
    ...habit,
    schedules: [{ effectiveDate: habit.createdDate, weekdays: [], weeklyTarget: 2 }],
  };
  const today = "2026-10-28";
  const first: Completion = { habitId: habit.id, date: "2026-10-26" };
  const met = [first, { habitId: habit.id, date: today }];
  const makePlan = (date: string, records: Completion[]) =>
    buildReminderPlan([weekly], date, "UTC", records);
  await reconcileReminders(os, makePlan(today, [first]), true);
  assert.deepEqual([...scheduled.keys()], ["still:h:daily"]);

  const quiet = makePlan(today, met);
  assert.deepEqual(quiet.map((plan) => plan.occurrenceDate), ["2026-11-02"]);
  await reconcileReminders(os, quiet, true);
  assert.deepEqual([...scheduled.keys()], ["still:h:resume"]);

  await reconcileReminders(os, makePlan(today, [first]), true);
  assert.deepEqual([...scheduled.keys()], ["still:h:daily"]);
  assert.deepEqual(makePlan("2026-11-02", met).map((plan) => plan.id), ["still:h:daily"]);
});

test("a weekly goal met before a timed pause stays quiet after resuming in the same week", () => {
  const paused: Habit = {
    ...habit,
    schedules: [{ effectiveDate: habit.createdDate, weekdays: [], weeklyTarget: 2 }],
    periods: [
      { startDate: habit.createdDate, endDate: "2026-10-28" },
      { startDate: "2026-10-30", endDate: null },
    ],
  };
  const records = ["2026-10-26", "2026-10-27"].map((date) => ({ habitId: habit.id, date }));
  assert.equal(buildReminderPlan([paused], "2026-10-28", "UTC", records)[0]?.occurrenceDate, "2026-11-02");
});

test("Android defers each recurring weekday until a pause ends", async () => {
  const paused: Habit = {
    ...habit,
    periods: [
      { startDate: habit.createdDate, endDate: "2026-10-27" },
      { startDate: "2026-11-03", endDate: null },
    ],
  };
  const { os, scheduled } = driver();
  const old = buildReminderPlan([paused], "2026-10-27", "UTC");
  await reconcileReminders(os, old, true);
  const plans = buildReminderPlan([paused], "2026-10-27", "UTC", [], true);
  assert.deepEqual(plans.map(({ id, startsOn, weekday, occurrenceDate }) =>
    [id, startsOn, weekday, occurrenceDate]), [
    ["still:h:2", "2026-11-03", 2, undefined],
    ["still:h:4", "2026-11-03", 4, undefined],
  ]);
  await reconcileReminders(os, plans, true);
  assert.deepEqual([...scheduled.keys()], ["still:h:2", "still:h:4"]);
});

test("Android quiets a met weekly goal but keeps its daily recurrence from Monday", () => {
  const weekly: Habit = {
    ...habit,
    schedules: [{ effectiveDate: habit.createdDate, weekdays: [], weeklyTarget: 1 }],
  };
  const today = "2026-10-28";
  const records = [{ habitId: habit.id, date: today }];
  const [deferred] = buildReminderPlan([weekly], today, "UTC", records, true);
  assert.equal(deferred?.id, "still:h:daily");
  assert.equal(deferred?.weekday, null);
  assert.equal(deferred?.startsOn, "2026-11-02");
  assert.equal(deferred?.occurrenceDate, undefined);
  const [undone] = buildReminderPlan([weekly], today, "UTC", [], true);
  assert.equal(undone?.startsOn, undefined);
  assert.notEqual(undone?.signature, deferred?.signature);
});
test("weekday plans map Sunday to 1, preserve local time, and daily habits use one slot", () => {
  const plans = buildReminderPlan(
    [
      {
        ...habit,
        schedules: [{ effectiveDate: "2026-10-26", weekdays: [0, 1] }],
      },
    ],
    "2026-10-27",
    "Europe/Helsinki",
  );
  assert.deepEqual(
    plans.map((p) => [p.weekday, p.hour, p.minute]),
    [
      [1, 9, 30],
      [2, 9, 30],
    ],
  );
  assert.equal(
    buildReminderPlan(
      [
        {
          ...habit,
          schedules: [
            { effectiveDate: "2026-10-26", weekdays: [0, 1, 2, 3, 4, 5, 6] },
          ],
        },
      ],
      "2026-10-27",
      "Europe/Helsinki",
    ).length,
    1,
  );
  assert.equal(
    buildReminderPlan(
      [{ ...habit, archived: true }],
      "2026-10-27",
      "Europe/Helsinki",
    ).length,
    0,
  );
});
test("edits, archive, deletion and disabling replace or cancel only Still reminders", async () => {
  const d = driver();
  d.scheduled.set("other-app", { id: "other-app", signature: "" });
  const plan = buildReminderPlan([habit], "2026-10-27", "Europe/Helsinki");
  await reconcileReminders(d.os, plan, true);
  assert.equal(d.scheduled.size, 3);
  await reconcileReminders(d.os, plan, true);
  assert.equal(d.scheduled.size, 3);
  const edited = buildReminderPlan(
    [{ ...habit, reminderTime: "10:00", name: "Read slowly" }],
    "2026-10-27",
    "Europe/Helsinki",
  );
  await reconcileReminders(d.os, edited, true);
  assert.equal(d.scheduled.get(edited[0]!.id)?.signature, edited[0]?.signature);
  await reconcileReminders(d.os, [], true);
  assert.deepEqual([...d.scheduled.keys()], ["other-app"]);
  await reconcileReminders(d.os, plan, true);
  await reconcileReminders(d.os, plan, false);
  assert.deepEqual([...d.scheduled.keys()], ["other-app"]);
});
test("partial scheduling failures clean up and allow a later retry", async () => {
  const d = driver();
  const plan = buildReminderPlan([habit], "2026-10-27", "Europe/Helsinki");
  await reconcileReminders(d.os, plan, true);
  d.fail();
  await assert.rejects(
    reconcileReminders(
      d.os,
      buildReminderPlan(
        [{ ...habit, reminderTime: "10:00" }],
        "2026-10-27",
        "Europe/Helsinki",
      ),
      true,
    ),
  );
  assert.equal(d.scheduled.size, 0);
});
test("time zone changes invalidate schedules and capacity overflow is explicit", async () => {
  const d = driver();
  const a = buildReminderPlan([habit], "2026-10-27", "Europe/Helsinki");
  const b = buildReminderPlan([habit], "2026-10-27", "America/New_York");
  assert.notEqual(a[0]?.signature, b[0]?.signature);
  await assert.rejects(
    reconcileReminders(
      d.os,
      Array.from({ length: 61 }, (_, i) => ({ ...a[0]!, id: `still:${i}` })),
      true,
    ),
    /60/,
  );
  assert.equal(d.scheduled.size, 0);
});
