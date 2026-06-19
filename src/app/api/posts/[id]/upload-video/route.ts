import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { assertContentOsSupabaseWriteSafety } from "@/lib/env";

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const routeParamsSchema = z.object({
  id: z.string().uuid(),
});

const videoExtensionsByMime: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertContentOsSupabaseWriteSafety();
    const { id } = routeParamsSchema.parse(await params);
    const { supabase, user } = await requireApiUser();
    const formData = await request.formData();
    const file = formData.get("video");

    if (!(file instanceof File)) {
      throw new Error("Upload a video file.");
    }

    const extension = videoExtensionsByMime[file.type];

    if (!extension) {
      throw new Error("Uploaded file must be an MP4 or QuickTime video.");
    }

    if (file.size > MAX_VIDEO_BYTES) {
      throw new Error("Uploaded video must be 100 MB or smaller.");
    }

    const { data: post, error: postError } = await supabase
      .from("generated_posts")
      .select("id, user_id, post_type")
      .eq("id", id)
      .single();

    if (postError || !post || post.user_id !== user.id) {
      throw new Error("Post not found or not owned by current user.");
    }

    if (post.post_type !== "reel") {
      throw new Error("Video uploads are only enabled for Reel packages.");
    }

    const storagePath = `${user.id}/${id}/reel-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from("post-images")
      .getPublicUrl(storagePath);

    const videoUrl = publicUrlData.publicUrl;

    const { error: mediaError } = await supabase.from("media_assets").insert({
      user_id: user.id,
      post_id: id,
      storage_path: storagePath,
      public_url: videoUrl,
      source: "upload",
      prompt: "Manual Rallio Reel video upload.",
    });

    if (mediaError) {
      throw new Error(mediaError.message);
    }

    const { data: updatedPost, error: updateError } = await supabase
      .from("generated_posts")
      .update({
        video_url: videoUrl,
        video_status: "uploaded",
        video_error: null,
        video_source: "upload",
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updatedPost) {
      throw new Error(updateError?.message || "Could not save uploaded video.");
    }

    return jsonOk({ video_url: videoUrl, post: updatedPost });
  } catch (error) {
    return jsonError(error, 400);
  }
}
