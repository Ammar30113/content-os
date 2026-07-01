import "server-only";

import { createBufferPost } from "@/lib/buffer/client";
import {
  getCarouselMediaIssue,
  getRenderedCarouselSlideUrls,
} from "@/lib/content/carousel-media";
import { normalizeHashtags, platforms } from "@/lib/content/types";
import { getConfiguredBufferPlatforms, type BufferBrand } from "@/lib/env";
import type { ContentOsSupabaseClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

type GeneratedPost = Database["public"]["Tables"]["generated_posts"]["Row"];
type PublishingJob = Database["public"]["Tables"]["publishing_jobs"]["Row"];
type PublishPlatform = (typeof platforms)[number];

type SendJobOptions = {
  userId?: string;
};

type SendDueJobsOptions = {
  horizonHours?: number;
  limit?: number;
};

export type BufferSendResult = {
  jobId: string;
  postId: string;
  platform: PublishPlatform;
  bufferPostId: string;
  scheduledFor: string;
};

export async function sendPublishingJobToBuffer(
  supabase: ContentOsSupabaseClient,
  jobId: string,
  options: SendJobOptions = {},
): Promise<BufferSendResult> {
  const { data: job, error: jobError } = await supabase
    .from("publishing_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    throw new Error(jobError?.message || "Publishing job not found.");
  }

  if (options.userId && job.user_id !== options.userId) {
    throw new Error("Publishing job is not owned by the current user.");
  }

  if (!job.post_id) {
    throw new Error("Publishing job is missing a post.");
  }

  const platform = normalizePublishPlatform(job.platform);
  const { data: post, error: postError } = await supabase
    .from("generated_posts")
    .select("*")
    .eq("id", job.post_id)
    .single();

  if (postError || !post) {
    throw new Error(postError?.message || "Generated post not found.");
  }

  if (options.userId && post.user_id !== options.userId) {
    throw new Error("Post is not owned by the current user.");
  }

  if (job.status === "ready" || job.status === "published") {
    throw new Error(`${platform} has already been sent to Buffer.`);
  }

  if (job.status === "processing") {
    throw new Error(`${platform} is already being sent to Buffer.`);
  }

  if (job.status !== "queued" && job.status !== "failed") {
    throw new Error(`${platform} publishing job is ${job.status} and cannot be sent.`);
  }

  const nextAttempts = job.attempts + 1;
  const { data: claimedJob, error: claimError } = await supabase
    .from("publishing_jobs")
    .update({
      status: "processing",
      attempts: nextAttempts,
      error: null,
    })
    .eq("id", job.id)
    .eq("status", job.status)
    .eq("attempts", job.attempts)
    .select("id")
    .maybeSingle();

  if (claimError) {
    throw new Error(claimError.message);
  }

  if (!claimedJob) {
    throw new Error(
      `${platform} is already being processed by another Buffer handoff.`,
    );
  }

  let bufferPostCreated = false;
  let bufferPostId: string | null = null;
  let jobReadyPersisted = false;

  try {
    const carouselSlideUrls = getRenderedCarouselSlideUrls(post.template_fields);
    const brandSlug = validateBufferReadyPost(post, platform, job);

    const bufferPost = await createBufferPost({
      postId: post.id,
      platform,
      brandSlug,
      text: buildPlatformText(post, platform),
      imageUrl: post.image_url,
      imageUrls: post.post_type === "carousel" ? carouselSlideUrls : null,
      altText: platform === "instagram" ? buildInstagramAltText(post, brandSlug) : null,
      scheduledFor: new Date(job.scheduled_for).toISOString(),
    });
    bufferPostCreated = true;
    bufferPostId = bufferPost.id;
    const templateFields = withBufferPostMetadata({
      templateFields: post.template_fields,
      platform,
      bufferPostId: bufferPost.id,
      scheduledFor: bufferPost.dueAt || job.scheduled_for,
    });

    const jobUpdate = await supabase
      .from("publishing_jobs")
      .update({
        status: "ready",
        attempts: nextAttempts,
        error: null,
      })
      .eq("id", job.id)
      .eq("status", "processing")
      .select()
      .single();

    if (jobUpdate.error || !jobUpdate.data) {
      throw new Error(jobUpdate.error?.message || "Could not update publishing job.");
    }

    jobReadyPersisted = true;

    const postUpdate = await supabase
      .from("generated_posts")
      .update({
        status: "scheduled",
        publish_error: null,
        template_fields: templateFields,
      })
      .eq("id", post.id)
      .select()
      .single();

    if (postUpdate.error || !postUpdate.data) {
      throw new Error(postUpdate.error?.message || "Could not update generated post.");
    }

    return {
      jobId: job.id,
      postId: post.id,
      platform,
      bufferPostId: bufferPost.id,
      scheduledFor: bufferPost.dueAt || job.scheduled_for,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Buffer publishing failed.";

    if (bufferPostCreated) {
      const reconciliationMessage = `Buffer post ${bufferPostId || "created"} was created, but Content OS could not finish saving the handoff: ${message} Do not retry automatically; inspect Buffer first.`;

      await Promise.all([
        supabase
          .from("publishing_jobs")
          .update({
            status: jobReadyPersisted ? "ready" : "processing",
            attempts: nextAttempts,
            error: reconciliationMessage,
          })
          .eq("id", job.id),
        supabase
          .from("generated_posts")
          .update({ publish_error: reconciliationMessage })
          .eq("id", job.post_id),
      ]);

      throw new Error(reconciliationMessage);
    }

    await Promise.all([
      supabase
        .from("publishing_jobs")
        .update({
          status: "failed",
          attempts: nextAttempts,
          error: message,
        })
        .eq("id", job.id),
      supabase
        .from("generated_posts")
        .update({
          publish_error: message,
        })
        .eq("id", job.post_id),
    ]);

    throw new Error(message);
  }
}

export async function sendDuePublishingJobsToBuffer(
  supabase: ContentOsSupabaseClient,
  options: SendDueJobsOptions = {},
) {
  const horizonHours = options.horizonHours ?? 48;
  const limit = options.limit ?? 20;
  const horizon = new Date(Date.now() + horizonHours * 60 * 60 * 1000);
  const configuredPlatforms = getConfiguredBufferPlatforms();

  if (!configuredPlatforms.length) {
    return {
      sent: [],
      failures: [],
      scanned: 0,
    };
  }

  const { data: jobs, error } = await supabase
    .from("publishing_jobs")
    .select("id")
    .in("platform", configuredPlatforms)
    .in("status", ["queued", "failed"])
    .lte("scheduled_for", horizon.toISOString())
    .lt("attempts", 3)
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const results: BufferSendResult[] = [];
  const failures: { jobId: string; error: string }[] = [];

  for (const job of jobs || []) {
    try {
      results.push(await sendPublishingJobToBuffer(supabase, job.id));
    } catch (error) {
      failures.push({
        jobId: job.id,
        error: error instanceof Error ? error.message : "Buffer publishing failed.",
      });
    }
  }

  return {
    sent: results,
    failures,
    scanned: jobs?.length || 0,
  };
}

function normalizePublishPlatform(platform: string): PublishPlatform {
  if (platform === "instagram" || platform === "x" || platform === "linkedin") {
    return platform;
  }

  throw new Error(`Unsupported publishing platform: ${platform}.`);
}

function validateBufferReadyPost(
  post: GeneratedPost,
  platform: PublishPlatform,
  job: PublishingJob,
): BufferBrand {
  const scheduledDate = new Date(job.scheduled_for);
  const brandSlug = getPostBrandSlug(post.template_fields);

  if (!brandSlug) {
    throw new Error(
      "Buffer handoff requires template_fields.brand_slug to be either rallio or signal.",
    );
  }

  if (platform !== "instagram") {
    throw new Error(`${formatBrandName(brandSlug)} Buffer handoff is Instagram-only.`);
  }

  if (brandSlug === "rallio" && post.post_type === "reel") {
    throw new Error(
      "Rallio reels are script-only in this phase. Publish them manually after creating the video asset.",
    );
  }

  if (Number.isNaN(scheduledDate.getTime())) {
    throw new Error("Scheduled time is invalid.");
  }

  if (scheduledDate.getTime() < Date.now() - 5 * 60 * 1000) {
    throw new Error("Scheduled time is in the past. Pick a future slot first.");
  }

  if (platform === "instagram" && !post.image_url) {
    throw new Error("Instagram posts need an image before sending to Buffer.");
  }

  const carouselMediaIssue = getCarouselMediaIssue(
    post.post_type,
    post.template_fields,
  );

  if (carouselMediaIssue) {
    throw new Error(carouselMediaIssue);
  }

  if (!buildPlatformText(post, platform).trim()) {
    throw new Error(`${platform} copy is empty.`);
  }

  return brandSlug;
}

// Instagram enforces a hard 5-hashtag limit (rolled out December 2025): extra tags are
// stripped or block publishing, and oversized or identical tag blocks get throttled as
// spam. buildPlatformText is the single chokepoint every send path (manual, bulk, cron)
// flows through, so capping here guarantees no post can exceed it downstream.
const INSTAGRAM_MAX_HASHTAGS = 5;
const INSTAGRAM_HASHTAG_PATTERN = /#[\p{L}\p{N}_]+/gu;

export function capInstagramHashtags(tags: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const raw of tags) {
    const tag = raw.trim();

    if (!tag) {
      continue;
    }

    const key = tag.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(tag);
  }

  return unique.slice(0, INSTAGRAM_MAX_HASHTAGS);
}

export function buildPlatformText(post: GeneratedPost, platform: PublishPlatform) {
  if (platform === "x") {
    return clampForX(post.x_version || post.hook || post.headline || post.caption || "");
  }

  if (platform === "linkedin") {
    return post.linkedin_version || post.caption || post.hook || post.headline || "";
  }

  const rawCaption = post.caption || post.hook || post.headline || "";
  const captionTags = rawCaption.match(INSTAGRAM_HASHTAG_PATTERN) || [];
  const hashtags = capInstagramHashtags([
    ...captionTags,
    ...normalizeHashtags(post.hashtags || []),
  ]);
  // Strip hashtags out of the caption body and re-append a single capped block so the
  // published post can never exceed Instagram's 5-tag limit, no matter how many the model
  // or the stored field carried. The keyword-rich caption body stays intact for search.
  const captionBody = rawCaption
    .replace(INSTAGRAM_HASHTAG_PATTERN, "")
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/[^\S\n]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return [captionBody, hashtags.join(" ")].filter(Boolean).join("\n\n");
}

function clampForX(value: string) {
  const trimmed = value.trim();

  if (trimmed.length <= 280) {
    return trimmed;
  }

  return `${trimmed.slice(0, 277).trimEnd()}...`;
}

function withBufferPostMetadata({
  templateFields,
  platform,
  bufferPostId,
  scheduledFor,
}: {
  templateFields: Json;
  platform: PublishPlatform;
  bufferPostId: string;
  scheduledFor: string;
}): Json {
  const fields = isRecord(templateFields) ? templateFields : {};
  const existingBufferPosts = isRecord(fields.buffer_posts)
    ? fields.buffer_posts
    : {};

  return {
    ...fields,
    buffer_posts: {
      ...existingBufferPosts,
      [platform]: {
        buffer_post_id: bufferPostId,
        status: "ready",
        sent_at: new Date().toISOString(),
        scheduled_for: scheduledFor,
      },
    },
  };
}

function isRecord(value: Json | undefined): value is Record<string, Json | undefined> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getTemplateFieldString(templateFields: Json, key: string) {
  if (!isRecord(templateFields)) {
    return null;
  }

  const value = templateFields[key];

  return typeof value === "string" ? value : null;
}

function getPostBrandSlug(templateFields: Json): BufferBrand | null {
  const value = getTemplateFieldString(templateFields, "brand_slug");

  return value === "rallio" || value === "signal" ? value : null;
}

function formatBrandName(brandSlug: BufferBrand) {
  return brandSlug === "signal" ? "Signal" : "Rallio";
}

// Instagram reads alt text as a search/ranking signal, so we describe the post with the
// concrete fields it already carries instead of a generic "social post graphic" string.
function buildInstagramAltText(post: GeneratedPost, brandSlug: BufferBrand) {
  const descriptor =
    brandSlug === "rallio" ? "Rallio local taste map" : "Signal urge reset";
  const details =
    brandSlug === "rallio"
      ? [
          getTemplateFieldString(post.template_fields, "business_name"),
          getTemplateFieldString(post.template_fields, "spot_category"),
          getTemplateFieldString(post.template_fields, "launch_neighborhood") ||
            getTemplateFieldString(post.template_fields, "recommender_neighborhood"),
        ]
      : [
          getTemplateFieldString(post.template_fields, "signal_principle"),
          getTemplateFieldString(post.template_fields, "signal_trigger"),
        ];
  const detail = details.filter(Boolean).join(", ");
  const core = detail || post.headline?.trim() || "";

  return core ? `${descriptor}: ${core}` : `${descriptor} Instagram post`;
}
