import {
  getRallioBatchSlotGuide,
  getRallioSignalOffset,
} from "../src/lib/content/rallio";

// Simulate three consecutive 5-post batches with different idea ids the way
// generate-batch-plan derives its offsets.
const ideaIds = [
  "0d9c5e9a-3a0f-4f6e-9d2b-1c2d3e4f5a6b",
  "7b1f2c3d-8e9a-4b5c-a6d7-e8f9a0b1c2d3",
  "c4d5e6f7-a8b9-4c0d-9e1f-2a3b4c5d6e7f",
];

for (const ideaId of ideaIds) {
  const offset = getRallioSignalOffset(ideaId);
  console.log(`\nbatch (offset ${offset}):`);

  for (let slot = 1; slot <= 5; slot += 1) {
    const guide = getRallioBatchSlotGuide(slot, offset);
    console.log(
      `  ${slot}. [${guide.contentType}] "${guide.workingTitle}" — ${guide.localSignal.spot_name} (${guide.localSignal.neighborhood}) door=${guide.ctaDoor}`,
    );
  }
}

// Overlapping-offset case: the second batch must skip signals already used by
// the first batch (this previously produced unfixable novelty-gate loops).
console.log("\noverlap check (offsets 45 then 46, with exclusions):");
const used = new Set<string>();
for (let slot = 1; slot <= 5; slot += 1) {
  const guide = getRallioBatchSlotGuide(slot, 45, used);
  used.add(guide.localSignal.id);
}
console.log(`  first batch used: ${[...used].join(", ")}`);
for (let slot = 1; slot <= 5; slot += 1) {
  const guide = getRallioBatchSlotGuide(slot, 46, used);
  used.add(guide.localSignal.id);
  console.log(
    `  second batch ${slot}: ${guide.localSignal.id} ${
      [...used].slice(0, 5).includes(guide.localSignal.id) ? "(DUPLICATE!)" : ""
    }`,
  );
}
