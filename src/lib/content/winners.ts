import "server-only";

import type { ContentOsSupabaseClient } from "@/lib/supabase/server";

export type WinningHook = {
  hook: string;
  pillar: string | null;
  status: string;
};

const APPROVED_STATUSES = ["approved", "scheduled", "published"];

/**
 * Pulls hooks the user has actually shipped or approved, plus virality-passing
 * drafts. Used to inject "what's resonating on this account" into the system
 * prompt so generation drifts toward the user's proven voice instead of a
 * generic brand description.
 */
export async function getRecentWinningHooks(
  supabase: ContentOsSupabaseClient,
  limit = 6,
): Promise<WinningHook[]> {
  const { data, error } = await supabase
    .from("generated_posts")
    .select("hook, pillar, status, template_fields, created_at")
    .in("status", APPROVED_STATUSES)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error || !data) {
    return [];
  }

  const winners: WinningHook[] = [];
  const seen = new Set<string>();

  for (const row of data) {
    const hook = (row.hook || "").trim();
    if (!hook || hook.length < 12 || hook.length > 220) {
      continue;
    }

    const key = normalize(hook);
    if (seen.has(key)) {
      continue;
    }

    if (!passedQualityGate(row.template_fields)) {
      continue;
    }

    seen.add(key);
    winners.push({
      hook,
      pillar: row.pillar,
      status: row.status,
    });

    if (winners.length >= limit) {
      break;
    }
  }

  return winners;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function passedQualityGate(templateFields: unknown): boolean {
  if (!templateFields || typeof templateFields !== "object") {
    return true;
  }

  const fields = templateFields as Record<string, unknown>;
  const gate = fields.quality_gate;

  if (!gate || typeof gate !== "object") {
    return true;
  }

  const gateRecord = gate as Record<string, unknown>;

  // Skip explicit fallback content - those failed the bar.
  if (gateRecord.repaired === true || gateRecord.passed === false) {
    return false;
  }

  return true;
}
