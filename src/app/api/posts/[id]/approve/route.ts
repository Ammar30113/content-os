import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";
import { requireApiUser } from "@/lib/auth";

const routeParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertContentOsSupabaseWriteSafety();
    const { id } = routeParamsSchema.parse(await params);
    const { supabase } = await requireApiUser();

    const { data, error } = await supabase
      .from("generated_posts")
      .update({ status: "approved" })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Could not approve post.");
    }

    return jsonOk({ post: data });
  } catch (error) {
    return jsonError(error, 400);
  }
}
