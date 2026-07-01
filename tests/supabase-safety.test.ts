import assert from "node:assert/strict";
import test from "node:test";

import {
  EXPECTED_SUPABASE_URL,
  checkSupabaseProjectUrl,
} from "../src/lib/supabase-safety";

test("accepts only the exact Content OS Supabase URL", () => {
  assert.equal(checkSupabaseProjectUrl(EXPECTED_SUPABASE_URL).ok, true);

  for (const value of [
    `https://${EXPECTED_SUPABASE_URL}.evil.example`,
    `${EXPECTED_SUPABASE_URL}.evil.example`,
    `${EXPECTED_SUPABASE_URL}/rest/v1`,
    EXPECTED_SUPABASE_URL.replace("https:", "http:"),
    `https://user:pass@rxcxgnmnwonqzizjrgoh.supabase.co`,
  ]) {
    assert.equal(checkSupabaseProjectUrl(value).ok, false, value);
  }
});
