import test from "node:test";
import assert from "node:assert/strict";
import {
  sendTestReminder,
  cancelTestReminder,
  TEST_REMINDER_ID,
  type TestReminderDriver,
} from "../src/notifications/test-reminder";
import { reconcileReminders } from "../src/notifications/reminders";

function driver() {
  const pending = new Map<string, unknown>([
    ["still:habit:daily", { habit: true }],
  ]);
  const backend: TestReminderDriver = {
    cancel: async (id) => {
      pending.delete(id);
    },
    schedule: async (id, seconds) => {
      pending.set(id, { seconds });
    },
  };
  return { pending, backend };
}
test("retesting leaves a single short-delay test and preserves habit reminders", async () => {
  const { pending, backend } = driver();
  await sendTestReminder(backend, true);
  await sendTestReminder(backend, true);
  assert.equal(pending.size, 2);
  assert.deepEqual(pending.get(TEST_REMINDER_ID), { seconds: 5 });
  assert.ok(pending.has("still:habit:daily"));
});
test("blocked permission removes a stale test without touching habit reminders", async () => {
  const { pending, backend } = driver();
  pending.set(TEST_REMINDER_ID, {});
  await assert.rejects(sendTestReminder(backend, false), /not allowed/);
  assert.deepEqual([...pending.keys()], ["still:habit:daily"]);
});
test("failed test scheduling cleans up a partially created request", async () => {
  const { pending, backend } = driver();
  backend.schedule = async (id) => {
    pending.set(id, {});
    throw new Error("OS failure");
  };
  await assert.rejects(sendTestReminder(backend, true), /OS failure/);
  assert.deepEqual([...pending.keys()], ["still:habit:daily"]);
});
test("habit reconciliation and explicit test cancellation use separate namespaces", async () => {
  const { pending, backend } = driver();
  await sendTestReminder(backend, true);
  await reconcileReminders(
    {
      list: async () =>
        [...pending.keys()].map((id) => ({ id, signature: "" })),
      cancel: backend.cancel,
      schedule: async () => {},
    },
    [],
    false,
  );
  assert.ok(pending.has(TEST_REMINDER_ID));
  await cancelTestReminder(backend);
  assert.equal(pending.size, 0);
});
