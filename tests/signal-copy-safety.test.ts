import { test } from "node:test";
import assert from "node:assert/strict";

import { enforceSignalCopySafety } from "../src/lib/content/signal";
import type { GeneratedContent } from "../src/lib/content/types";

function signalContent(caption: string): GeneratedContent {
  return {
    pillar: "founder_story",
    template_type: "founder_story",
    hook: "Stay steady tonight",
    headline: "Stay steady tonight",
    subhead: "",
    caption,
    hashtags: [],
    cta: "Open the app",
    carousel_slides: [],
    reel_script: "",
    x_version: "",
    linkedin_version: "",
    image_prompt: "",
    template_fields: {
      brand_slug: "signal",
      selected_platforms: ["instagram"],
    },
  } as GeneratedContent;
}

test("enforceSignalCopySafety allows privacy vocabulary containing 'cure' as a substring", () => {
  // Regression: a substring match on the banned word "cure" flagged "secure"
  // and "security" — core vocabulary for a privacy-first app — and hard-failed
  // Signal generation. Word-boundary matching must let these through.
  assert.doesNotThrow(() =>
    enforceSignalCopySafety(
      signalContent("Your data stays secure and private on your device."),
    ),
  );
  assert.doesNotThrow(() =>
    enforceSignalCopySafety(
      signalContent("Security and privacy come first, and you procure nothing."),
    ),
  );
});

test("enforceSignalCopySafety still blocks the banned word 'cure'", () => {
  assert.throws(
    () =>
      enforceSignalCopySafety(
        signalContent("This protocol will cure you for good."),
      ),
    /cure/,
  );
});

test("enforceSignalCopySafety blocks explicit terms", () => {
  assert.throws(
    () => enforceSignalCopySafety(signalContent("Avoid porn triggers at night.")),
    /porn/,
  );
});
