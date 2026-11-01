import test from "node:test";
import assert from "node:assert/strict";
import { saveCheckIn } from "../src/domain/check-in";

test("vibration follows a successful new completion", async () => {
  const events: string[] = [];
  await saveCheckIn(
    async () => {
      events.push("saved");
      return true;
    },
    async () => {
      events.push("feedback");
    },
    true,
    true,
  );
  assert.deepEqual(events, ["saved", "feedback"]);
});
test("disabled, unchecked and unchanged check-ins do not vibrate", async () => {
  for (const [enabled, complete, changed] of [
    [false, true, true],
    [true, false, true],
    [true, true, false],
  ]) {
    let calls = 0;
    await saveCheckIn(
      async () => !!changed,
      async () => {
        calls++;
      },
      !!enabled,
      !!complete,
    );
    assert.equal(calls, 0);
  }
});
test("failed persistence does not vibrate and failed haptics does not undo a save", async () => {
  let calls = 0;
  await assert.rejects(
    saveCheckIn(
      async () => {
        throw new Error("storage");
      },
      async () => {
        calls++;
      },
      true,
      true,
    ),
    /storage/,
  );
  assert.equal(calls, 0);
  await assert.doesNotReject(
    saveCheckIn(
      async () => true,
      async () => {
        throw new Error("no haptics");
      },
      true,
      true,
    ),
  );
});
