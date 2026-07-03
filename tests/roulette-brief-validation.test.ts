import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRallioRouletteBrief,
  rallioLocalSignals,
  rallioTopicSeeds,
} from "../src/lib/content/rallio";
import { getSignalTopicSeed } from "../src/lib/content/signal";
import { ideaInputSchema, postQuantities } from "../src/lib/content/types";

const quantities = postQuantities.map(Number);

// Auto-picked topics are validated by the same ideaInputSchema as user-typed
// briefs, so every brief the topic banks can emit must clear that gate. A
// 5-post Rallio brief once outgrew the cap and broke generation outright.
function assertBriefPassesApiValidation(brief: string, label: string) {
  const result = ideaInputSchema.safeParse({
    title: "Roulette topic",
    brief,
    platform: "instagram",
    post_type: "single",
    tone: "founder",
    template_hint: "auto",
  });

  if (!result.success) {
    assert.fail(
      `${label}: ${result.error.issues.map((issue) => issue.message).join("; ")}`,
    );
  }
}

test("every Rallio roulette brief passes idea validation at every batch size", () => {
  for (const seed of rallioTopicSeeds) {
    for (const quantity of quantities) {
      assertBriefPassesApiValidation(
        buildRallioRouletteBrief(seed, quantity),
        `${seed.id} at quantity ${quantity}`,
      );
    }
  }
});

test("single-post Rallio briefs still fit with the required local signal appended", () => {
  for (const seed of rallioTopicSeeds) {
    for (const signal of rallioLocalSignals) {
      const brief = [
        buildRallioRouletteBrief(seed, 1),
        `\nRequired local signal: ${signal.spot_name}, ${signal.neighborhood}, ${signal.category}. Order/detail: ${signal.signature_order}. Regular quote: "${signal.regular_quote}". Participation prompt: ${signal.participation_prompt}.`,
      ].join("");

      assertBriefPassesApiValidation(brief, `${seed.id} + ${signal.id}`);
    }
  }
});

test("every Signal bank brief passes idea validation across rhythm offsets", () => {
  for (let offset = 0; offset < 12; offset += 1) {
    for (const slot of quantities) {
      assertBriefPassesApiValidation(
        getSignalTopicSeed(slot, offset).brief,
        `signal slot ${slot} offset ${offset}`,
      );
    }
  }
});
