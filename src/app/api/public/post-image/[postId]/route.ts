import { z } from "zod";

import { assertContentOsSupabaseWriteSafety } from "@/lib/env";
import { convertImageToInstagramJpeg } from "@/lib/images/render";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const publicPostImageParamsSchema = z.object({
  postId: z
    .string()
    .transform((value) => value.replace(/\.(png|jpe?g|webp)$/i, ""))
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
        return imageResponse(file, inferContentType(asset.storage_path), {
          forceJpeg: true,
        });
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

    return imageResponse(body, contentType, { forceJpeg: true });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Post image could not be loaded.",
      { status: 400 },
    );
  }
}

async function imageResponse(
  file: Blob,
  contentType: string,
  { forceJpeg = false }: { forceJpeg?: boolean } = {},
) {
  const body =
    forceJpeg && !/^image\/jpe?g$/i.test(contentType)
      ? await convertImageToInstagramJpeg(Buffer.from(await file.arrayBuffer()))
      : Buffer.from(await file.arrayBuffer());
  const resolvedContentType = forceJpeg ? "image/jpeg" : contentType;
  const extension = resolvedContentType === "image/jpeg" ? "jpg" : "png";

  return new Response(new Uint8Array(body), {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="rallio-post.${extension}"`,
      "Content-Length": String(body.byteLength),
      "Content-Type": resolvedContentType,
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
