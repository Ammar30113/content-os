import assert from "node:assert/strict";
import test from "node:test";

import {
  formatPostBrandName,
  getInitialPostBrand,
  getPostBrandFilter,
  getPostBrandSlug,
} from "../src/lib/content/post-brand";

test("reads only supported post brand metadata", () => {
  assert.equal(getPostBrandSlug({ brand_slug: "rallio" }), "rallio");
  assert.equal(getPostBrandSlug({ brand_slug: "signal" }), "signal");
  assert.equal(getPostBrandSlug({ brand_slug: "other" }), null);
  assert.equal(getPostBrandSlug(null), null);
  assert.equal(getPostBrandSlug([]), null);
});

test("keeps posts without valid brand metadata in a review queue", () => {
  assert.equal(getPostBrandFilter({}), "unassigned");
  assert.equal(getPostBrandFilter({ brand_slug: "wordofai" }), "unassigned");
  assert.equal(formatPostBrandName("unassigned"), "Unassigned");
});

test("opens the newest valid brand queue", () => {
  assert.equal(
    getInitialPostBrand([
      { template_fields: { brand_slug: "signal" } },
      { template_fields: { brand_slug: "rallio" } },
    ]),
    "signal",
  );

  assert.equal(
    getInitialPostBrand([
      { template_fields: {} },
      { template_fields: { brand_slug: "rallio" } },
    ]),
    "rallio",
  );

  assert.equal(getInitialPostBrand([{ template_fields: {} }]), "unassigned");
});

test("formats channel labels consistently", () => {
  assert.equal(formatPostBrandName("rallio"), "Rallio");
  assert.equal(formatPostBrandName("signal"), "Signal");
});
