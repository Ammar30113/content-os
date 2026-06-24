import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import {
  buildRallioCarouselSlideSpecs,
  MAX_CAROUSEL_SLIDES,
} from "@/lib/content/rallio-carousel";
import { templateFieldsSchema } from "@/lib/content/types";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";
import { renderTemplateJpeg } from "@/lib/images/render";
import { requireApiUser } from "@/lib/auth";
import type { Json } from "@/types/database";

export const runtime = "nodejs";

const renderCarouselInputSchema = z.object({
  post_id: z.string().uuid(),
  template_fields: templateFieldsSchema,
  headline: z.string().optional(),
});

export async function POST(request: Request) {
  let postId: string | null = null;

  try {
    assertContentOsSupabaseWriteSafety();
    const input = renderCarouselInputSchema.parse(await request.json());
    postId = input.post_id;
    const { supabase, user } = await requireApiUser();

    const { data: post, error: postError } = await supabase
      .from("generated_posts")
      .select("id, user_id, post_type, image_prompt")
      .eq("id", input.post_id)
      .single();

    if (postError || !post || post.user_id !== user.id) {
      throw new Error("Post not found or not owned by current user.");
    }

    if (post.post_type !== "carousel") {
      throw new Error("Carousel rendering is only available for carousel posts.");
    }

    const specs = buildRallioCarouselSlideSpecs({
      postId: post.id,
      postType: post.post_type,
      templateFields: input.template_fields,
      headline: input.headline,
    });

    if (!specs || specs.length < 2) {
      throw new Error(
        "Could not build carousel slides for this post. Step carousels stay single-image; render a regular image instead.",
      );
    }

    if (specs.length > MAX_CAROUSEL_SLIDES) {
      throw new Error(
        `Instagram carousels allow at most ${MAX_CAROUSEL_SLIDES} slides.`,
      );
    }

    await supabase
      .from("generated_posts")
      .update({ image_status: "generating", image_error: null })
      .eq("id", input.post_id);

    const batchStamp = Date.now();
    const slideUrls: string[] = [];

    for (let index = 0; index < specs.length; index += 1) {
      const spec = specs[index];
      const imageBuffer = await renderTemplateJpeg(spec.templateType, spec.fields);
      const filename = `template-${batchStamp}-s${index}.jpg`;
      const storagePath = `${user.id}/${input.post_id}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(storagePath, imageBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(storagePath);

      const imageUrl = publicUrlData.publicUrl;
      slideUrls.push(imageUrl);

      const { error: mediaError } = await supabase.from("media_assets").insert({
        user_id: user.id,
        post_id: input.post_id,
        storage_path: storagePath,
        public_url: imageUrl,
        source: "carousel_slide",
        prompt: post.image_prompt,
      });

      if (mediaError) {
        throw new Error(mediaError.message);
      }
    }

    const templateFields: Json = {
      ...input.template_fields,
      slide_image_urls: slideUrls,
    };

    const { data: updatedPost, error: updateError } = await supabase
      .from("generated_posts")
      .update({
        image_url: slideUrls[0],
        image_status: "generated",
        image_error: null,
        template_fields: templateFields,
      })
      .eq("id", input.post_id)
      .select()
      .single();

    if (updateError || !updatedPost) {
      throw new Error(updateError?.message || "Could not update carousel images.");
    }

    return jsonOk({
      slide_image_urls: slideUrls,
      image_url: slideUrls[0],
      post: updatedPost,
    });
  } catch (error) {
    if (postId) {
      try {
        const { supabase } = await requireApiUser();
        await supabase
          .from("generated_posts")
          .update({
            image_status: "failed",
            image_error:
              error instanceof Error
                ? error.message
                : "Carousel rendering failed.",
          })
          .eq("id", postId);
      } catch {
        // Preserve the original rendering error for the response.
      }
    }

    return jsonError(error, 500);
  }
}
