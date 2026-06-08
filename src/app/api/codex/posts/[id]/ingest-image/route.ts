import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { codexErrorStatus, requireCodexContext } from "@/lib/codex-auth";
import { convertImageToInstagramJpeg } from "@/lib/images/render";

const routeParamsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  image_url: z.string().url(),
});

const MAX_SOURCE_BYTES = 15 * 1024 * 1024; // 15MB before conversion

// POST /api/codex/posts/[id]/ingest-image — take an externally-hosted creative
// asset from Codex (Canva/Fal/Picsart/etc.), run it through the same Sharp gate
// every ContentOS image uses, store it in Supabase, and attach it to the post.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase, ownerUserId } = requireCodexContext(request);
    const { id } = routeParamsSchema.parse(await params);
    const { image_url } = bodySchema.parse(await request.json());

    const { data: post, error: postError } = await supabase
      .from("generated_posts")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", ownerUserId)
      .single();

    if (postError || !post) {
      throw new Error("Post not found or not owned by the Codex owner.");
    }

    const response = await fetch(image_url);

    if (!response.ok) {
      throw new Error(`Could not fetch image_url (HTTP ${response.status}).`);
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.startsWith("image/")) {
      throw new Error(
        `image_url must point to an image (got "${contentType || "unknown"}").`,
      );
    }

    const sourceBuffer = Buffer.from(await response.arrayBuffer());

    if (sourceBuffer.byteLength > MAX_SOURCE_BYTES) {
      throw new Error("image_url exceeds the 15MB ingest size limit.");
    }

    const jpeg = await convertImageToInstagramJpeg(sourceBuffer);
    const storagePath = `${ownerUserId}/${id}/codex-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(storagePath, jpeg, {
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

    const { error: mediaError } = await supabase.from("media_assets").insert({
      user_id: ownerUserId,
      post_id: id,
      storage_path: storagePath,
      public_url: imageUrl,
      source: "ai",
      prompt: image_url,
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
      })
      .eq("id", id)
      .eq("user_id", ownerUserId)
      .select()
      .single();

    if (updateError || !updatedPost) {
      throw new Error(updateError?.message || "Could not save the ingested image.");
    }

    return jsonOk({ image_url: imageUrl, post: updatedPost });
  } catch (error) {
    return jsonError(error, codexErrorStatus(error));
  }
}
