import assert from "node:assert/strict";
import test from "node:test";

import { normalizeInternalRedirectPath } from "../src/lib/auth-redirect";

test("keeps valid internal redirect paths", () => {
  assert.equal(
    normalizeInternalRedirectPath("/app/posts?tab=scheduled#latest"),
    "/app/posts?tab=scheduled#latest",
  );
});

test("rejects protocol-relative and backslash redirects", () => {
  assert.equal(normalizeInternalRedirectPath("//evil.example"), "/app/dashboard");
  assert.equal(normalizeInternalRedirectPath("/\\evil.example"), "/app/dashboard");
  assert.equal(normalizeInternalRedirectPath("/%5cevil.example"), "/app/dashboard");
});

test("rejects absolute URLs and control characters", () => {
  assert.equal(normalizeInternalRedirectPath("https://evil.example"), "/app/dashboard");
  assert.equal(normalizeInternalRedirectPath("/app\n/ideas"), "/app/dashboard");
});
