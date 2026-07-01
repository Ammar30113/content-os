import assert from "node:assert/strict";
import test from "node:test";

import { requireFutureScheduledIso } from "../src/lib/content/publishing-workflow";

test("accepts schedule times at least five minutes in the future", () => {
  const now = Date.parse("2026-07-01T12:00:00.000Z");

  assert.equal(
    requireFutureScheduledIso("2026-07-01T12:10:00.000Z", now),
    "2026-07-01T12:10:00.000Z",
  );
});

test("rejects invalid and near-past schedule times", () => {
  const now = Date.parse("2026-07-01T12:00:00.000Z");

  assert.throws(
    () => requireFutureScheduledIso("not-a-date", now),
    /at least 5 minutes/,
  );
  assert.throws(
    () => requireFutureScheduledIso("2026-07-01T12:04:59.000Z", now),
    /at least 5 minutes/,
  );
});
