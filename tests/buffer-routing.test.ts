import assert from "node:assert/strict";
import test from "node:test";

import { getBufferChannelId } from "../src/lib/buffer/client";

const BUFFER_ENV_KEYS = [
  "BUFFER_ACCESS_TOKEN",
  "BUFFER_ORGANIZATION_ID",
  "BUFFER_RALLIO_INSTAGRAM_CHANNEL_ID",
  "BUFFER_SIGNAL_INSTAGRAM_CHANNEL_ID",
  "BUFFER_INSTAGRAM_CHANNEL_ID",
] as const;

test("routes Signal and Rallio to their own Instagram channels", () => {
  withBufferEnv(
    {
      BUFFER_ACCESS_TOKEN: "test-token",
      BUFFER_ORGANIZATION_ID: "test-organization",
      BUFFER_RALLIO_INSTAGRAM_CHANNEL_ID: "rallio-channel",
      BUFFER_SIGNAL_INSTAGRAM_CHANNEL_ID: "signal-channel",
      BUFFER_INSTAGRAM_CHANNEL_ID: "legacy-channel",
    },
    () => {
      assert.equal(getBufferChannelId("instagram", "signal"), "signal-channel");
      assert.equal(getBufferChannelId("instagram", "rallio"), "rallio-channel");
    },
  );
});

test("never falls Signal back to Rallio or the legacy channel", () => {
  withBufferEnv(
    {
      BUFFER_ACCESS_TOKEN: "test-token",
      BUFFER_ORGANIZATION_ID: "test-organization",
      BUFFER_RALLIO_INSTAGRAM_CHANNEL_ID: "rallio-channel",
      BUFFER_SIGNAL_INSTAGRAM_CHANNEL_ID: undefined,
      BUFFER_INSTAGRAM_CHANNEL_ID: "legacy-channel",
    },
    () => {
      assert.throws(
        () => getBufferChannelId("instagram", "signal"),
        /BUFFER_SIGNAL_INSTAGRAM_CHANNEL_ID/,
      );
    },
  );
});

test("rejects a shared Signal and Rallio channel ID", () => {
  withBufferEnv(
    {
      BUFFER_ACCESS_TOKEN: "test-token",
      BUFFER_ORGANIZATION_ID: "test-organization",
      BUFFER_RALLIO_INSTAGRAM_CHANNEL_ID: "shared-channel",
      BUFFER_SIGNAL_INSTAGRAM_CHANNEL_ID: "shared-channel",
      BUFFER_INSTAGRAM_CHANNEL_ID: undefined,
    },
    () => {
      assert.throws(
        () => getBufferChannelId("instagram", "signal"),
        /must be different/,
      );
    },
  );
});

function withBufferEnv(
  values: Partial<Record<(typeof BUFFER_ENV_KEYS)[number], string | undefined>>,
  run: () => void,
) {
  const previous = Object.fromEntries(
    BUFFER_ENV_KEYS.map((key) => [key, process.env[key]]),
  );

  try {
    for (const key of BUFFER_ENV_KEYS) {
      const value = values[key];

      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }

    run();
  } finally {
    for (const key of BUFFER_ENV_KEYS) {
      const value = previous[key];

      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}
