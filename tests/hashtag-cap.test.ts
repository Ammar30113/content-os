import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPlatformText,
  capInstagramHashtags,
} from "../src/lib/buffer/publishing";

type PostArg = Parameters<typeof buildPlatformText>[0];

const HASHTAG_PATTERN = /#[\p{L}\p{N}_]+/gu;

function makePost(overrides: Record<string, unknown>): PostArg {
  return {
    caption: "",
    hook: "",
    headline: "",
    hashtags: [],
    x_version: "",
    linkedin_version: "",
    post_type: "single",
    ...overrides,
  } as unknown as PostArg;
}

test("caps an Instagram caption at 5 hashtags and keeps the caption body", () => {
  const post = makePost({
    caption:
      "Late-night pull hits hardest alone.\n\nOne quiet reset.\n\n#a #b #c #d #e #f #g #h",
  });

  const text = buildPlatformText(post, "instagram");
  const tags = text.match(HASHTAG_PATTERN) || [];

  assert.equal(tags.length, 5);
  assert.ok(text.startsWith("Late-night pull hits hardest alone."));
});

test("merges caption and field hashtags, dedups case-insensitively, caps at 5", () => {
  const tags = capInstagramHashtags([
    "#Toronto",
    "#toronto",
    "#food",
    "#pizza",
    "#ossington",
    "#local",
    "#extra",
  ]);

  assert.deepEqual(tags, ["#Toronto", "#food", "#pizza", "#ossington", "#local"]);
});

test("field hashtags still count toward the 5-tag Instagram cap", () => {
  const post = makePost({
    caption: "Regulars keep coming back.\n\n#one #two #three",
    hashtags: ["#four", "#five", "#six", "#seven"],
  });

  const tags = buildPlatformText(post, "instagram").match(HASHTAG_PATTERN) || [];

  assert.equal(tags.length, 5);
});

test("does not append hashtags to the compressed X version", () => {
  const post = makePost({
    x_version: "Sharp compressed take.",
    hashtags: ["#a", "#b", "#c"],
  });

  assert.equal(buildPlatformText(post, "x"), "Sharp compressed take.");
});
