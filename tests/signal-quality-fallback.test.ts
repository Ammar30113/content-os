import { test } from "node:test";
import assert from "node:assert/strict";

import {
  createSignalQualityFallbackContent,
  enforceSignalCopySafety,
} from "../src/lib/content/signal";
import { validateGeneratedContentQuality } from "../src/lib/content/quality";
import type { GeneratedContent, SignalContentType } from "../src/lib/content/types";
import { signalContentTypes } from "../src/lib/content/types";

function candidateWithCaption(caption: string, hook = "A model hook line"): GeneratedContent {
  return {
    pillar: "tutorial",
    template_type: "tutorial",
    hook,
    headline: "Model Headline",
    subhead: "A model tension line",
    caption,
    hashtags: ["#discipline", "#habits"],
    cta: "Open Signal",
    carousel_slides: [],
    reel_script: "",
    x_version: "A compressed model line.",
    linkedin_version: "An expanded model line.",
    image_prompt: "",
    template_fields: {
      brand_slug: "signal",
      selected_platforms: ["instagram"],
      signal_content_type: "urge_reset_protocol",
      signal_template_type: "signal_protocol",
    },
  } as GeneratedContent;
}

test("fallback with no candidate passes safety and quality gates for every content type", () => {
  for (const contentType of signalContentTypes) {
    const content = createSignalQualityFallbackContent({
      candidate: null,
      failures: ["Caption must include 3-6 bullet lines, found 7."],
      attempt: 4,
      fallback: { contentType: contentType as SignalContentType },
    });

    assert.doesNotThrow(
      () => enforceSignalCopySafety(content),
      `safety gate failed for ${contentType}`,
    );

    const quality = validateGeneratedContentQuality({ content });
    assert.equal(
      quality.ok,
      true,
      `quality gate failed for ${contentType}: ${!quality.ok ? quality.failures.join(" ") : ""}`,
    );
    assert.equal(content.template_fields.brand_slug, "signal");
    assert.deepEqual(content.template_fields.selected_platforms, ["instagram"]);

    const gate = content.template_fields.quality_gate as {
      passed: boolean;
      repaired: boolean;
    };
    assert.equal(gate.passed, false);
    assert.equal(gate.repaired, true);
  }
});

test("fallback reuses safe model bullets and caps them at five", () => {
  const caption = [
    "Hook line",
    "1. bullet one",
    "2. bullet two",
    "3. bullet three",
    "4. bullet four",
    "5. bullet five",
    "6. bullet six",
    "7. bullet seven",
  ].join("\n");
  const content = createSignalQualityFallbackContent({
    candidate: candidateWithCaption(caption),
    failures: ["Caption must include 3-6 bullet lines, found 7."],
    attempt: 4,
    fallback: { contentType: "urge_reset_protocol" },
  });

  const bulletLines = content.caption
    .split("\n")
    .filter((line) => line.trim().startsWith("- "));

  assert.ok(bulletLines.length >= 3 && bulletLines.length <= 5);
  assert.ok(content.caption.includes("bullet one"));
  assert.equal(validateGeneratedContentQuality({ content }).ok, true);
});

test("fallback drops model copy that would trip the safety gate", () => {
  const content = createSignalQualityFallbackContent({
    candidate: candidateWithCaption(
      "- a bullet\n- another bullet\n- third bullet",
      "This protocol will cure you.",
    ),
    failures: ["Caption is too thin."],
    attempt: 2,
    fallback: { contentType: "discipline_quote" },
  });

  assert.doesNotThrow(() => enforceSignalCopySafety(content));
  assert.ok(!content.hook.toLowerCase().includes("cure"));
  assert.equal(validateGeneratedContentQuality({ content }).ok, true);
});

test("fallback prefers the planned working title for the headline", () => {
  const content = createSignalQualityFallbackContent({
    candidate: null,
    failures: ["Caption is too thin."],
    attempt: 1,
    fallback: {
      contentType: "pattern_awareness",
      batchWorkingTitle: "Track The Danger Window",
    },
  });

  assert.equal(content.headline, "Track The Danger Window");
  assert.equal(content.template_fields.headline, "Track The Danger Window");
});
