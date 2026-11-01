import test from "node:test";
import assert from "node:assert/strict";
import { dragLayout, edgeScroll, moveToIndex } from "../src/domain/reorder";

test("drag previews unequal rows in both directions without changing input", () => {
  const ids = ["a", "b", "c"];
  const heights = { a: 40, b: 120, c: 80 };
  const down = dragLayout(ids, heights, "a", 190)!;
  assert.deepEqual(down.ids, ["b", "c", "a"]);
  assert.equal(down.index, 2);
  assert.equal(down.dragOffset, 190);
  assert.deepEqual(down.offsets, { a: 224, b: -52, c: -52 });
  const up = dragLayout(ids, heights, "c", -180)!;
  assert.deepEqual(up.ids, ["c", "a", "b"]);
  assert.deepEqual(up.offsets, { a: 92, b: 92, c: -184 });
  assert.deepEqual(ids, ["a", "b", "c"]);
});

test("a stationary drag stays put and clamps beyond list boundaries", () => {
  const heights = { a: 40, b: 120, c: 80 };
  assert.deepEqual(dragLayout(["a", "b", "c"], heights, "b", 0)?.ids, [
    "a",
    "b",
    "c",
  ]);
  assert.equal(
    dragLayout(["a", "b", "c"], heights, "b", -999)?.dragOffset,
    -52,
  );
  assert.equal(dragLayout(["a", "b", "c"], heights, "b", 999)?.dragOffset, 92);
  assert.equal(dragLayout(["a"], heights, "a", 40)?.dragOffset, 0);
});

test("unmeasured or invalid layouts cannot begin a drag", () => {
  for (const heights of [{ a: 0 }, { a: Number.NaN }, {}] as Record<
    string,
    number
  >[]) {
    assert.equal(dragLayout(["a"], heights, "a", 0), null);
  }
  assert.equal(dragLayout(["a"], { a: 40 }, "missing", 0), null);
  assert.equal(dragLayout(["a"], { a: 40 }, "a", Number.NaN), null);
});

test("keyboard moves keep all IDs and clamp at endpoints", () => {
  assert.deepEqual(moveToIndex(["a", "b", "c"], "a", 2), ["b", "c", "a"]);
  assert.deepEqual(moveToIndex(["a", "b", "c"], "c", -1), ["c", "a", "b"]);
  assert.deepEqual(moveToIndex(["a", "b"], "missing", 1), ["a", "b"]);
});

test("edge scrolling accelerates near edges and is elapsed-time bounded", () => {
  assert.equal(edgeScroll(300, 100, 600, 16), 0);
  assert.equal(edgeScroll(100, 100, 600, 16), -8);
  assert.equal(edgeScroll(600, 100, 600, 16), 8);
  assert.equal(edgeScroll(576, 100, 600, 16), 4);
  assert.equal(edgeScroll(700, 100, 600, 1000), 16);
});
