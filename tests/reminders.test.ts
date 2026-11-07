import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReminderPlan,
  reconcileReminders,
  type ReminderDriver,
  type ReminderPlan,
  type ScheduledReminder,
} from "../src/notifications/reminders";
import type { Habit } from "../src/domain/models";
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
