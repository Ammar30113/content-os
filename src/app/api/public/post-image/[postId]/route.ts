import { z } from "zod";

import { assertContentOsSupabaseWriteSafety } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const publicPostImageParamsSchema = z.object({
  postId: z
    .string()
    .transform((value) => value.replace(/\.png$/i, ""))
    .pipe(z.string().uuid()),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    assertContentOsSupabaseWriteSafety();
    const { postId } = publicPostImageParamsSchema.parse(await params);
    const supabase = createSupabaseAdminClient();

    const { data: post, error: postError } = await supabase
      .from("generated_posts")
      .select("id, image_url")
      .eq("id", postId)
      .single();

    if (postError || !post?.image_url) {
      return new Response("Post image not found.", { status: 404 });
    }

    const { data: asset } = await supabase
      .from("media_assets")
      .select("storage_path")
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (asset?.storage_path) {
      const { data: file, error: downloadError } = await supabase.storage
        .from("post-images")
        .download(asset.storage_path);

      if (!downloadError && file) {
        return imageResponse(file, inferContentType(asset.storage_path));
      }
    }

    const imageResponseFromUrl = await fetch(post.image_url, {
      cache: "no-store",
    });

    if (!imageResponseFromUrl.ok) {
      return new Response("Post image could not be loaded.", { status: 502 });
    }

    const contentType =
      imageResponseFromUrl.headers.get("content-type") || inferContentType(post.image_url);
    const body = await imageResponseFromUrl.blob();

    return imageResponse(body, contentType);
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Post image could not be loaded.",
      { status: 400 },
    );
  }
}

function imageResponse(file: Blob, contentType: string) {
  return new Response(file, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": 'inline; filename="wordofaii-post.png"',
      "Content-Length": String(file.size),
      "Content-Type": contentType,
    },
  });
}

function inferContentType(path: string) {
  if (/\.jpe?g($|\?)/i.test(path)) {
    return "image/jpeg";
  }

  if (/\.webp($|\?)/i.test(path)) {
    return "image/webp";
  }

  return "image/png";
}
