import test from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  dateKey,
  datesBetween,
  monthDates,
  parseDate,
  weekDates,
} from "../src/domain/dates";

test("local date keys use local calendar components instead of UTC", () => {
  assert.equal(dateKey(new Date(2026, 9, 27, 0, 15)), "2026-10-27");
});
test("calendar arithmetic crosses leap days and year boundaries", () => {
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
  assert.equal(addDays("2024-02-29", 1), "2024-03-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});
test("calendar arithmetic survives Helsinki spring and autumn DST changes", () => {
  assert.deepEqual(datesBetween("2026-03-28", "2026-03-30"), [
    "2026-03-28",
    "2026-03-29",
    "2026-03-30",
  ]);
  assert.deepEqual(datesBetween("2026-10-24", "2026-10-26"), [
    "2026-10-24",
    "2026-10-25",
    "2026-10-26",
  ]);
});
test("invalid local dates are rejected instead of silently normalized", () => {
  for (const value of ["2026-02-30", "2026-13-01", "2026-1-01", "bad"])
    assert.throws(() => parseDate(value));
});
test("weeks begin Monday and month lengths include leap years", () => {
  assert.deepEqual(weekDates("2026-10-27"), [
    "2026-10-26",
    "2026-10-27",
    "2026-10-28",
    "2026-10-29",
    "2026-10-30",
    "2026-10-31",
    "2026-11-01",
  ]);
  assert.equal(monthDates("2024-02-20").length, 29);
  assert.deepEqual(datesBetween("2026-10-28", "2026-10-27"), []);
});
