import { test } from "node:test";
import assert from "node:assert/strict";

import { validateGeneratedContentQuality } from "../src/lib/content/quality";
import type { GeneratedContent } from "../src/lib/content/types";

function contentWithCaption(caption: string): GeneratedContent {
  return {
    pillar: "tutorial",
    template_type: "tutorial",
    hook: "The urge feels permanent",
    headline: "The 10-Minute Reset",
    subhead: "A short window is enough",
    caption,
    hashtags: ["#discipline", "#habits", "#focus"],
    cta: "Start SOS",
    carousel_slides: [],
    reel_script: "",
    x_version:
      "An urge is a spike, not a verdict. Ten minutes of distance beats an argument you cannot win.",
    linkedin_version:
      "Discipline is mostly design.\n\nThe window between cue and action is short, and it is enough.",
    image_prompt: "",
    template_fields: {
      brand_slug: "signal",
      selected_platforms: ["instagram"],
    },
  } as GeneratedContent;
}

function captionFromBullets(bullets: string[]) {
  return [
    "Late-night phone is a cue, not a coincidence.",
    "The loop starts before you notice it.",
    ...bullets,
    "Ten minutes of distance changes the ending.",
    "#discipline #habits #focus",
  ].join("\n");
}

test("caption with six numbered protocol steps passes the gate", () => {
  // Regression: Signal protocol seeds ask for 5-6 steps, but the gate capped
  // bullets at 5 and hard-failed whole batches with "Caption must include 3-5
  // bullets." Six steps is a legitimate Signal protocol caption.
  const result = validateGeneratedContentQuality({
    content: contentWithCaption(
      captionFromBullets([
        "1. Name the cue",
        "2. Change the room",
        "3. Move for two minutes",
        "4. Choose one redirect",
        "5. Let the timer finish",
        "6. Record the signal",
      ]),
    ),
  });

  assert.equal(result.ok, true);
});

test("asterisk, em-dash, and arrow bullet markers are counted", () => {
  for (const bullets of [
    ["* Name the cue", "* Change the room", "* Choose one redirect"],
    ["— Name the cue", "— Change the room", "— Choose one redirect"],
    ["→ Name the cue", "→ Change the room", "→ Choose one redirect"],
  ]) {
    const result = validateGeneratedContentQuality({
      content: contentWithCaption(captionFromBullets(bullets)),
    });

    assert.equal(
      result.ok,
      true,
      `expected bullets to be counted: ${bullets[0]}`,
    );
  }
});

test("Step-numbered lines are counted as bullets", () => {
  const result = validateGeneratedContentQuality({
    content: contentWithCaption(
      captionFromBullets([
        "Step 1: open Signal",
        "Step 2: name the state",
        "Step 3: start the timer",
        "Step 4: move your body",
      ]),
    ),
  });

  assert.equal(result.ok, true);
});

test("too few bullets fails with the found count in the message", () => {
  const result = validateGeneratedContentQuality({
    content: contentWithCaption(
      captionFromBullets(["- Name the cue", "- Change the room"]),
    ),
  });

  assert.equal(result.ok, false);
  assert.ok(!result.ok && result.failures.some((f) => f.includes("found 2")));
});

test("more than six bullets fails the gate", () => {
  const result = validateGeneratedContentQuality({
    content: contentWithCaption(
      captionFromBullets([
        "- one",
        "- two",
        "- three",
        "- four",
        "- five",
        "- six",
        "- seven",
      ]),
    ),
  });

  assert.equal(result.ok, false);
});

test("thin caption fails the gate", () => {
  const result = validateGeneratedContentQuality({
    content: contentWithCaption("One lonely line."),
  });

  assert.equal(result.ok, false);
});

test("x_version copied into the caption fails platform transformation", () => {
  const caption = captionFromBullets([
    "- Name the cue",
    "- Change the room",
    "- Choose one redirect",
  ]);
  const content = contentWithCaption(caption);
  content.x_version = "Late-night phone is a cue, not a coincidence.";

  const result = validateGeneratedContentQuality({ content });

  assert.equal(result.ok, false);
});
