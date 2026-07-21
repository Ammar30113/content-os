import { test } from "node:test";
import assert from "node:assert/strict";

import { isOpenAIConfigError } from "../src/lib/errors";

test("classifies project model-access 403s as config errors", () => {
  // Exact shape reported from production when OPENAI_MODEL was set to a model
  // the OpenAI project has not enabled.
  assert.equal(
    isOpenAIConfigError(
      "403 Project `proj_d3QA19S8qxD2ysNqIpZfna64` does not have access to model `gpt-5-mini`",
    ),
    true,
  );
});

test("classifies unknown-model and API-key failures as config errors", () => {
  assert.equal(
    isOpenAIConfigError(
      "The model `gpt-9-ultra` does not exist or you do not have access to it.",
    ),
    true,
  );
  assert.equal(
    isOpenAIConfigError("401 Incorrect API key provided: sk-proj-***"),
    true,
  );
  assert.equal(
    isOpenAIConfigError("OPENAI_API_KEY is required to generate content."),
    true,
  );
});

test("does not classify transient or content failures as config errors", () => {
  assert.equal(isOpenAIConfigError("Rate limit reached for requests."), false);
  assert.equal(
    isOpenAIConfigError("Caption must include 3-6 bullet lines, found 7."),
    false,
  );
  assert.equal(isOpenAIConfigError("500 The server had an error."), false);
  assert.equal(
    isOpenAIConfigError("Request timed out after 60000ms."),
    false,
  );
});
