import assert from "node:assert/strict";
import test from "node:test";

import { normalizeRemoteHttpUrl } from "../src/lib/http/remote-url";

test("accepts public HTTP and HTTPS URLs", () => {
  assert.equal(
    normalizeRemoteHttpUrl("https://example.com/source?q=1").toString(),
    "https://example.com/source?q=1",
  );
});

test("rejects local and private network destinations", () => {
  for (const value of [
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://10.1.2.3",
    "http://169.254.169.254/latest/meta-data",
    "http://192.168.1.10",
    "http://[::1]",
    "http://service.internal",
  ]) {
    assert.throws(() => normalizeRemoteHttpUrl(value), /local or private/);
  }
});

test("rejects unsupported schemes and URL credentials", () => {
  assert.throws(() => normalizeRemoteHttpUrl("file:///etc/passwd"), /HTTP or HTTPS/);
  assert.throws(
    () => normalizeRemoteHttpUrl("https://user:pass@example.com"),
    /credentials/,
  );
});
