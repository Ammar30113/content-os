import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { postUpdateSchema } from "@/lib/content/types";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";
import { requireApiUser } from "@/lib/auth";
import type { Json } from "@/types/database";

const routeParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertContentOsSupabaseWriteSafety();
    const { id } = routeParamsSchema.parse(await params);
    const input = postUpdateSchema.parse(await request.json());
    const { supabase } = await requireApiUser();
    const updatePayload = {
      ...input,
      carousel_slides: input.carousel_slides as Json,
      template_fields: input.template_fields as Json,
    };

    const { data, error } = await supabase
      .from("generated_posts")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Could not save post.");
    }

    return jsonOk({ post: data });
  } catch (error) {
    return jsonError(error, 400);
  }
}
