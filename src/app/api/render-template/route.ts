import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { templateFieldsSchema, templateTypes } from "@/lib/content/types";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";
import { renderTemplatePng } from "@/lib/images/render";
import { requireApiUser } from "@/lib/auth";
import type { Json } from "@/types/database";

export const runtime = "nodejs";

const renderTemplateInputSchema = z.object({
  post_id: z.string().uuid(),
  template_type: z.enum(templateTypes),
  template_fields: templateFieldsSchema,
});

export async function POST(request: Request) {
  let postId: string | null = null;

  try {
    assertContentOsSupabaseWriteSafety();
    const input = renderTemplateInputSchema.parse(await request.json());
    postId = input.post_id;
    const { supabase, user } = await requireApiUser();

    const { data: post, error: postError } = await supabase
      .from("generated_posts")
      .select("id, user_id, image_prompt")
      .eq("id", input.post_id)
      .single();

    if (postError || !post || post.user_id !== user.id) {
      throw new Error("Post not found or not owned by current user.");
    }

    await supabase
      .from("generated_posts")
      .update({ image_status: "generating", image_error: null })
      .eq("id", input.post_id);

    const imageBuffer = await renderTemplatePng(
      input.template_type,
      input.template_fields,
    );
    const filename = `template-${Date.now()}.png`;
    const storagePath = `${user.id}/${input.post_id}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(storagePath, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from("post-images")
      .getPublicUrl(storagePath);

    const imageUrl = publicUrlData.publicUrl;

    const { error: mediaError } = await supabase.from("media_assets").insert({
      user_id: user.id,
      post_id: input.post_id,
      storage_path: storagePath,
      public_url: imageUrl,
      source: "template",
      prompt: post.image_prompt,
    });

    if (mediaError) {
      throw new Error(mediaError.message);
    }

    const { data: updatedPost, error: updateError } = await supabase
      .from("generated_posts")
      .update({
        image_url: imageUrl,
        image_status: "generated",
        image_error: null,
        template_type: input.template_type,
        template_fields: input.template_fields as Json,
      })
      .eq("id", input.post_id)
      .select()
      .single();

    if (updateError || !updatedPost) {
      throw new Error(updateError?.message || "Could not update post image.");
    }

    return jsonOk({ image_url: imageUrl, post: updatedPost });
  } catch (error) {
    if (postId) {
      try {
        const { supabase } = await requireApiUser();
        await supabase
          .from("generated_posts")
          .update({
            image_status: "failed",
            image_error:
              error instanceof Error ? error.message : "Image rendering failed.",
          })
          .eq("id", postId);
      } catch {
        // Preserve the original rendering error for the response.
      }
    }

    return jsonError(error, 500);
  }
}
