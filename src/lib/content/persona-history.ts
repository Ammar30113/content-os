import "server-only";

import type { ContentOsSupabaseClient } from "@/lib/supabase/server";

export type PersonaUsage = {
  hook: string | null;
  headline: string | null;
  status: string;
  created_at: string;
  days_ago: number;
};

const COOLDOWN_DAYS = 21;
const LOOKBACK_DAYS = 30;

export type PersonaCooldown = {
  figure: string;
  cooldown_days: number;
  on_cooldown: boolean;
  recent_uses: PersonaUsage[];
};

/**
 * Authority POV mode borrows credibility from a recognizable figure. If the
 * same figure was used recently, the account starts to read like a fan
 * page. This pulls the recent usages so the system prompt can force a
 * different angle.
 */
export async function getPersonaCooldown(
  supabase: ContentOsSupabaseClient,
  rawFigure: string | null | undefined,
): Promise<PersonaCooldown | null> {
  const figure = (rawFigure || "").trim();
  if (!figure) {
    return null;
  }

  const since = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("generated_posts")
    .select("hook, headline, status, template_fields, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error || !data) {
    return null;
  }

  const normalized = normalize(figure);
  const now = Date.now();
  const recent_uses: PersonaUsage[] = [];

  for (const row of data) {
    const fields = row.template_fields;
    const usedFigure = readAuthorityFigure(fields);
    if (!usedFigure) continue;
    if (normalize(usedFigure) !== normalized) continue;

    const createdAt = new Date(row.created_at).getTime();
    const days_ago = Math.floor((now - createdAt) / 86_400_000);

    recent_uses.push({
      hook: row.hook,
      headline: row.headline,
      status: row.status,
      created_at: row.created_at,
      days_ago,
    });
  }

  const on_cooldown = recent_uses.some((use) => use.days_ago < COOLDOWN_DAYS);

  return {
    figure,
    cooldown_days: COOLDOWN_DAYS,
    on_cooldown,
    recent_uses: recent_uses.slice(0, 5),
  };
}

function readAuthorityFigure(fields: unknown): string | null {
  if (!fields || typeof fields !== "object") return null;
  const value = (fields as Record<string, unknown>).authority_figure;
  return typeof value === "string" ? value : null;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}
