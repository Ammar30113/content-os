import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { deleteGeneratedPosts } from "@/lib/content/delete-posts";
import { postUpdateSchema } from "@/lib/content/types";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";
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
    const { supabase, user } = await requireApiUser();
    const updatePayload = {
      ...input,
      carousel_slides: input.carousel_slides as Json,
      template_fields: input.template_fields as Json,
    };

    if ("video_url" in input) {
      updatePayload.video_url = input.video_url || null;
    }

    const { data, error } = await supabase
      .from("generated_posts")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id)
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertContentOsSupabaseWriteSafety();
    const { id } = routeParamsSchema.parse(await params);
    const { supabase, user } = await requireApiUser();
    const result = await deleteGeneratedPosts(supabase, {
      postIds: [id],
      userId: user.id,
    });

    if (!result.deleted_count) {
      if (result.blocked_ids.includes(id)) {
        throw new Error(
          "This post has a live Buffer handoff. Cancel it in Buffer first, then delete it here.",
        );
      }

      throw new Error("Post not found or already deleted.");
    }

    return jsonOk(result);
  } catch (error) {
    return jsonError(error, 400);
  }
}
