import {
  getRallioBatchSlotGuide,
  getRallioSignalOffset,
} from "../src/lib/content/rallio";

// Rotation regression guard. This runs inside `test:logic`, so any assertion
// failure here MUST exit non-zero and turn the pipeline red — printing a warning
// and exiting 0 (the previous behavior) gave false confidence.
const failures: string[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    failures.push(message);
    console.error(`  ✗ ${message}`);
  }
}

// Simulate three consecutive 5-post batches with different idea ids the way
// generate-batch-plan derives its offsets. Each batch must use five distinct
// local signals (no intra-batch repeat).
const ideaIds = [
  "0d9c5e9a-3a0f-4f6e-9d2b-1c2d3e4f5a6b",
  "7b1f2c3d-8e9a-4b5c-a6d7-e8f9a0b1c2d3",
  "c4d5e6f7-a8b9-4c0d-9e1f-2a3b4c5d6e7f",
];

for (const ideaId of ideaIds) {
  const offset = getRallioSignalOffset(ideaId);
  console.log(`\nbatch (offset ${offset}):`);
  const batchSignalIds = new Set<string>();

  for (let slot = 1; slot <= 5; slot += 1) {
    const guide = getRallioBatchSlotGuide(slot, offset);
    console.log(
      `  ${slot}. [${guide.contentType}] "${guide.workingTitle}" — ${guide.localSignal.spot_name} (${guide.localSignal.neighborhood}) door=${guide.ctaDoor}`,
    );
    batchSignalIds.add(guide.localSignal.id);
  }

  assert(
    batchSignalIds.size === 5,
    `batch offset ${offset} repeated a local signal (only ${batchSignalIds.size}/5 distinct).`,
  );
}

// Overlapping-offset case: the second batch must skip signals already used by
// the first batch (this previously produced unfixable novelty-gate loops).
console.log("\noverlap check (offsets 45 then 46, with exclusions):");
const firstBatchIds = new Set<string>();
for (let slot = 1; slot <= 5; slot += 1) {
  const guide = getRallioBatchSlotGuide(slot, 45, firstBatchIds);
  firstBatchIds.add(guide.localSignal.id);
}
console.log(`  first batch used: ${[...firstBatchIds].join(", ")}`);

const used = new Set(firstBatchIds);
for (let slot = 1; slot <= 5; slot += 1) {
  const guide = getRallioBatchSlotGuide(slot, 46, used);
  const isDuplicate = firstBatchIds.has(guide.localSignal.id);
  console.log(
    `  second batch ${slot}: ${guide.localSignal.id} ${isDuplicate ? "(DUPLICATE!)" : ""}`,
  );
  assert(
    !isDuplicate,
    `second batch reused first-batch local signal ${guide.localSignal.id} despite exclusions.`,
  );
  used.add(guide.localSignal.id);
}

if (failures.length) {
  console.error(`\nverify-rotation FAILED with ${failures.length} issue(s).`);
  process.exit(1);
}

console.log("\nverify-rotation passed.");
