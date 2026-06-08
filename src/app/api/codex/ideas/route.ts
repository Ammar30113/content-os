import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { codexErrorStatus, requireCodexContext } from "@/lib/codex-auth";

const querySchema = z.object({
  status: z.enum(["draft", "generated", "archived"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

// GET /api/codex/ideas — hand Codex the raw briefs to design from.
export async function GET(request: Request) {
  try {
    const { supabase, ownerUserId } = requireCodexContext(request);
    const url = new URL(request.url);
    const { status, limit } = querySchema.parse({
      status: url.searchParams.get("status") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    });

    let query = supabase
      .from("content_ideas")
      .select("id, title, brief, source_url, source_summary, status, created_at")
      .eq("user_id", ownerUserId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return jsonOk({ ideas: data ?? [] });
  } catch (error) {
    return jsonError(error, codexErrorStatus(error));
  }
}
