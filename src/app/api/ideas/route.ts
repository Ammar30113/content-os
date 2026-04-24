import { jsonError, jsonOk } from "@/lib/api";
import { ideaInputSchema } from "@/lib/content/types";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";
import { requireApiUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    assertContentOsSupabaseWriteSafety();
    const input = ideaInputSchema.parse(await request.json());
    const { supabase, user } = await requireApiUser();

    const { data, error } = await supabase
      .from("content_ideas")
      .insert({
        user_id: user.id,
        title: input.title,
        brief: input.brief,
        source_url: input.source_url || null,
        status: "draft",
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Could not save idea.");
    }

    return jsonOk({ idea: data });
  } catch (error) {
    return jsonError(error, 400);
  }
}
