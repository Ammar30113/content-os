import "server-only";

import { createBufferPost } from "@/lib/buffer/client";
import { normalizeHashtags, platforms } from "@/lib/content/types";
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

  if (job.status === "ready") {
    throw new Error(`${platform} has already been sent to Buffer.`);
  }

  const nextAttempts = job.attempts + 1;

  try {
    validateBufferReadyPost(post, platform, job);

    await supabase
      .from("publishing_jobs")
      .update({ attempts: nextAttempts, error: null })
      .eq("id", job.id);

    const bufferPost = await createBufferPost({
      platform,
      text: buildPlatformText(post, platform),
      imageUrl: post.image_url,
      scheduledFor: new Date(job.scheduled_for).toISOString(),
    });
    const templateFields = withBufferPostMetadata({
      templateFields: post.template_fields,
      platform,
      bufferPostId: bufferPost.id,
      scheduledFor: bufferPost.dueAt || job.scheduled_for,
    });

    const [jobUpdate, postUpdate] = await Promise.all([
      supabase
        .from("publishing_jobs")
        .update({
          status: "ready",
          attempts: nextAttempts,
          error: null,
        })
        .eq("id", job.id)
        .select()
        .single(),
      supabase
        .from("generated_posts")
        .update({
          status: "scheduled",
          publish_error: null,
          template_fields: templateFields,
        })
        .eq("id", post.id)
        .select()
        .single(),
    ]);

    if (jobUpdate.error || !jobUpdate.data) {
      throw new Error(jobUpdate.error?.message || "Could not update publishing job.");
    }

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
  const { data: jobs, error } = await supabase
    .from("publishing_jobs")
    .select("id")
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
) {
  const scheduledDate = new Date(job.scheduled_for);

  if (Number.isNaN(scheduledDate.getTime())) {
    throw new Error("Scheduled time is invalid.");
  }

  if (scheduledDate.getTime() < Date.now() - 5 * 60 * 1000) {
    throw new Error("Scheduled time is in the past. Pick a future slot first.");
  }

  if (platform === "instagram" && !post.image_url) {
    throw new Error("Instagram posts need an image before sending to Buffer.");
  }

  if (!buildPlatformText(post, platform).trim()) {
    throw new Error(`${platform} copy is empty.`);
  }
}

function buildPlatformText(post: GeneratedPost, platform: PublishPlatform) {
  if (platform === "x") {
    return clampForX(post.x_version || post.hook || post.headline || post.caption || "");
  }

  if (platform === "linkedin") {
    return post.linkedin_version || post.caption || post.hook || post.headline || "";
  }

  const caption = post.caption || post.hook || post.headline || "";
  const hashtags = normalizeHashtags(post.hashtags || []);
  const missingHashtags = hashtags.filter((tag) => !caption.includes(tag));

  return [caption.trim(), missingHashtags.join(" ")].filter(Boolean).join("\n\n");
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
