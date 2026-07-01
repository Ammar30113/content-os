import { z } from "zod";

import { assertContentOsSupabaseWriteSafety } from "@/lib/env";
import {
  assertSafeRemoteHttpUrl,
  readResponseBufferWithLimit,
} from "@/lib/http/remote-url";
import { convertImageToInstagramJpeg } from "@/lib/images/render";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const MAX_PROXY_IMAGE_BYTES = 10 * 1024 * 1024;

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

    // Prefer the stored asset that matches the post's cover image. Carousel
    // posts have several assets, so "latest" would otherwise serve the last
    // slide instead of the cover.
    let asset: { storage_path: string } | null = null;

    const { data: coverAsset } = await supabase
      .from("media_assets")
      .select("storage_path")
      .eq("post_id", postId)
      .eq("public_url", post.image_url)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    asset = coverAsset;

    if (!asset?.storage_path) {
      const { data: latestAsset } = await supabase
        .from("media_assets")
        .select("storage_path")
        .eq("post_id", postId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      asset = latestAsset;
    }

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

    const remoteImageUrl = await assertSafeRemoteHttpUrl(post.image_url);
    const imageResponseFromUrl = await fetch(remoteImageUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!imageResponseFromUrl.ok) {
      return new Response("Post image could not be loaded.", { status: 502 });
    }

    const contentType =
      imageResponseFromUrl.headers.get("content-type") || inferContentType(post.image_url);

    if (!contentType.startsWith("image/")) {
      return new Response("Post image URL did not return an image.", { status: 502 });
    }

    const body = await readResponseBufferWithLimit(
      imageResponseFromUrl,
      MAX_PROXY_IMAGE_BYTES,
    );

    return imageResponse(body, contentType, { forceJpeg: true });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Post image could not be loaded.",
      { status: 400 },
    );
  }
}

async function imageResponse(
  file: Blob | Buffer,
  contentType: string,
  { forceJpeg = false }: { forceJpeg?: boolean } = {},
) {
  const input = Buffer.isBuffer(file)
    ? file
    : Buffer.from(await file.arrayBuffer());
  const body =
    forceJpeg && !/^image\/jpe?g$/i.test(contentType)
      ? await convertImageToInstagramJpeg(input)
      : input;
  const resolvedContentType = forceJpeg ? "image/jpeg" : contentType;
  const extension = resolvedContentType === "image/jpeg" ? "jpg" : "png";

  return new Response(new Uint8Array(body), {
    headers: {
      "Cache-Control": "no-store",
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
