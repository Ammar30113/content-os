import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";
import { requireApiUser } from "@/lib/auth";
import { validateImageUpload } from "@/lib/images/upload";

const routeParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertContentOsSupabaseWriteSafety();
    const { id } = routeParamsSchema.parse(await params);
    const { supabase, user } = await requireApiUser();
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      throw new Error("Upload an image file.");
    }

    const validatedImage = await validateImageUpload(file);

    const { data: post, error: postError } = await supabase
      .from("generated_posts")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (postError || !post || post.user_id !== user.id) {
      throw new Error("Post not found or not owned by current user.");
    }

    const storagePath = `${user.id}/${id}/upload-${Date.now()}.${validatedImage.extension}`;

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(storagePath, validatedImage.buffer, {
        contentType: validatedImage.contentType,
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
      post_id: id,
      storage_path: storagePath,
      public_url: imageUrl,
      source: "upload",
    });

    if (mediaError) {
      await supabase.storage.from("post-images").remove([storagePath]);
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
      .select()
      .single();

    if (updateError || !updatedPost) {
      await Promise.all([
        supabase
          .from("media_assets")
          .delete()
          .eq("user_id", user.id)
          .eq("storage_path", storagePath),
        supabase.storage.from("post-images").remove([storagePath]),
      ]);
      throw new Error(updateError?.message || "Could not save uploaded image.");
    }

    return jsonOk({ image_url: imageUrl, post: updatedPost });
  } catch (error) {
    return jsonError(error, 400);
  }
}
