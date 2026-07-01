/**
 * One-off backlog migration: re-render template-generated images so existing DRAFT
 * posts adopt the new 4:5 portrait output. New posts already render 4:5. Posts that
 * were already sent to Buffer or published can't be changed retroactively on Instagram,
 * so only status = "draft" posts are targeted.
 *
 * DRY RUN by default — lists what it would re-render and changes nothing.
 * Set APPLY=true to actually re-render, re-upload, and update the posts.
 *
 * Run from the repo root with the app env loaded (NEXT_PUBLIC_SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_APP_URL) and the react-server condition:
 *
 *   NODE_OPTIONS=--conditions=react-server npx tsx scripts/rerender-post-images.ts
 *   APPLY=true NODE_OPTIONS=--conditions=react-server npx tsx scripts/rerender-post-images.ts
 */
import { buildRallioCarouselSlideSpecs } from "../src/lib/content/rallio-carousel";
import { templateFieldsSchema, type TemplateType } from "../src/lib/content/types";
import { renderTemplateJpeg } from "../src/lib/images/render";
import { createSupabaseAdminClient } from "../src/lib/supabase/server";
import type { Json } from "../src/types/database";

type AdminClient = ReturnType<typeof createSupabaseAdminClient>;

const APPLY = process.env.APPLY === "true";
// Matches the render pipeline's own JPEG names: template-<stamp>.jpg and
// carousel slides template-<stamp>-s<index>.jpg. Uploaded photos never match.
const TEMPLATE_IMAGE = /\/template-\d+(?:-s\d+)?\.jpe?g(?:$|\?)/i;

async function uploadJpeg(
  supabase: AdminClient,
  path: string,
  jpeg: Buffer,
  post: { user_id: string; id: string; image_prompt: string | null },
  source: "template" | "carousel_slide",
) {
  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(path, jpeg, { contentType: "image/jpeg", upsert: false });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const url = supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;

  const { error: mediaError } = await supabase.from("media_assets").insert({
    user_id: post.user_id,
    post_id: post.id,
    storage_path: path,
    public_url: url,
    source,
    prompt: post.image_prompt,
  });

  if (mediaError) {
    throw new Error(mediaError.message);
  }

  return url;
}

async function main() {
  const supabase = createSupabaseAdminClient();

  const { data: posts, error } = await supabase
    .from("generated_posts")
    .select(
      "id, user_id, post_type, template_type, template_fields, image_url, image_prompt",
    )
    .eq("status", "draft")
    .eq("image_status", "generated")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const targets = (posts || []).filter((post) => {
    if (!post.image_url || !TEMPLATE_IMAGE.test(post.image_url)) {
      return false;
    }

    const fields = post.template_fields;
    const imageMode =
      fields && typeof fields === "object" && !Array.isArray(fields)
        ? (fields as Record<string, unknown>).image_mode
        : null;

    return imageMode !== "uploaded";
  });

  console.log(
    `${APPLY ? "APPLY" : "DRY RUN"} — ${targets.length} draft post(s) with template images.\n`,
  );

  let rerendered = 0;
  let failed = 0;

  for (const post of targets) {
    const label = `${post.post_type} ${post.id}`;

    try {
      const fields = templateFieldsSchema.parse(post.template_fields);

      if (!APPLY) {
        console.log(`  would re-render ${label}`);
        continue;
      }

      const stamp = Date.now();

      if (post.post_type === "carousel") {
        const specs = buildRallioCarouselSlideSpecs({
          postId: post.id,
          postType: post.post_type,
          templateFields: fields,
        });

        if (!specs || specs.length < 2) {
          throw new Error("could not rebuild carousel slides");
        }

        const slideUrls: string[] = [];

        for (let index = 0; index < specs.length; index += 1) {
          const jpeg = await renderTemplateJpeg(specs[index].templateType, specs[index].fields);
          const path = `${post.user_id}/${post.id}/template-${stamp}-s${index}.jpg`;
          slideUrls.push(await uploadJpeg(supabase, path, jpeg, post, "carousel_slide"));
        }

        const nextFields: Json = { ...fields, slide_image_urls: slideUrls };
        const { error: updateError } = await supabase
          .from("generated_posts")
          .update({ image_url: slideUrls[0], template_fields: nextFields })
          .eq("id", post.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      } else {
        const jpeg = await renderTemplateJpeg(post.template_type as TemplateType, fields);
        const path = `${post.user_id}/${post.id}/template-${stamp}.jpg`;
        const url = await uploadJpeg(supabase, path, jpeg, post, "template");

        const { error: updateError } = await supabase
          .from("generated_posts")
          .update({ image_url: url })
          .eq("id", post.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      }

      rerendered += 1;
      console.log(`  re-rendered ${label}`);
    } catch (renderError) {
      failed += 1;
      console.log(
        `  FAILED ${label}: ${renderError instanceof Error ? renderError.message : renderError}`,
      );
    }
  }

  console.log(
    `\nDone. ${rerendered} re-rendered, ${failed} failed.${APPLY ? "" : " (dry run — nothing changed)"}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
