import "server-only";

import { platforms } from "@/lib/content/types";
import { getCarouselMediaIssue } from "@/lib/content/carousel-media";
import {
  getBufferChannelQueueCap,
  getBufferChannelEnvName,
  getBufferEnvStatus,
  type BufferBrand,
} from "@/lib/env";
import type { ContentOsSupabaseClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

export const MANUAL_SLOT_TIME_ZONE = "America/Toronto";
export const MANUAL_SLOT_WINDOW_DAYS = 30;

type PublishPlatform = (typeof platforms)[number];
type PublishingJob = Database["public"]["Tables"]["publishing_jobs"]["Row"];

type EnsurePublishingJobsInput = {
  postId: string;
  userId: string;
  scheduledFor?: string | null;
  resendReady?: boolean;
};

export async function ensurePublishingJobsForPost(
  supabase: ContentOsSupabaseClient,
  { postId, userId, scheduledFor, resendReady = false }: EnsurePublishingJobsInput,
) {
  const { data: post, error: postError } = await supabase
    .from("generated_posts")
    .select("*")
    .eq("id", postId)
    .eq("user_id", userId)
    .single();

  if (postError || !post) {
    throw new Error(postError?.message || "Generated post not found.");
  }

  const carouselMediaIssue = getCarouselMediaIssue(
    post.post_type,
    post.template_fields,
  );

  if (carouselMediaIssue) {
    throw new Error(carouselMediaIssue);
  }

  const selectedPlatforms = getSelectedPublishingPlatforms(
    post.template_fields,
    post.platform,
  );
  const brandSlug = getPublishingBrandSlug(post.template_fields);
  const effectivePlatforms = getConfiguredPublishingPlatforms(
    selectedPlatforms,
    brandSlug,
  );
  const skippedPlatforms = selectedPlatforms.filter(
    (platform) => !effectivePlatforms.includes(platform),
  );

  if (!effectivePlatforms.length) {
    const brandHint = brandSlug
      ? `${formatBrandName(brandSlug)} requires ${selectedPlatforms
          .map((platform) => getBufferChannelEnvName(platform, brandSlug))
          .join(", ")}.`
      : "Regenerate this post with template_fields.brand_slug set to rallio or signal.";

    throw new Error(
      `No configured Buffer channel matches this post. Selected: ${selectedPlatforms.join(", ")}. ${brandHint}`,
    );
  }

  if (skippedPlatforms.length) {
    await cancelUnconfiguredPublishingJobs(supabase, {
      userId,
      postId: post.id,
      platforms: skippedPlatforms,
    });
  }

  if (post.status === "published") {
    const { data: existingJobs, error: existingJobsError } = await supabase
      .from("publishing_jobs")
      .select("*")
      .eq("post_id", post.id)
      .eq("user_id", userId)
      .in("platform", effectivePlatforms)
      .in("status", ["ready", "published"]);

    if (existingJobsError) {
      throw new Error(existingJobsError.message);
    }

    if (existingJobs?.length) {
      return {
        post,
        jobs: existingJobs,
        selectedPlatforms: effectivePlatforms,
        scheduledFor: post.scheduled_for || new Date().toISOString(),
      };
    }

    throw new Error("This post is already marked published in Content OS.");
  }

  await assertBufferQueueCapacity(supabase, {
    userId,
    postId,
    platforms: effectivePlatforms,
  });

  const resolvedScheduledFor =
    scheduledFor ||
    getFutureIso(post.scheduled_for) ||
    (await getNextManualSlotForUser(supabase, {
      userId,
      postId,
      platform: effectivePlatforms[0],
    })).toISOString();

  const { data: scheduledPost, error: scheduleError } = await supabase
    .from("generated_posts")
    .update({
      status: "scheduled",
      scheduled_for: resolvedScheduledFor,
      publish_error: null,
    })
    .eq("id", post.id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (scheduleError || !scheduledPost) {
    throw new Error(scheduleError?.message || "Could not schedule post.");
  }

  const jobs: PublishingJob[] = [];

  for (const platform of effectivePlatforms) {
    const { data: existingJob } = await supabase
      .from("publishing_jobs")
      .select("id, status")
      .eq("post_id", post.id)
      .eq("user_id", userId)
      .eq("platform", platform)
      .maybeSingle();

    if (existingJob?.status === "ready" && resendReady) {
      const { data: resentJob, error: resendError } = await supabase
        .from("publishing_jobs")
        .update({
          user_id: userId,
          post_id: post.id,
          platform,
          status: "queued",
          scheduled_for: resolvedScheduledFor,
          error: null,
        })
        .eq("id", existingJob.id)
        .select()
        .single();

      if (resendError || !resentJob) {
        throw new Error(
          resendError?.message || "Could not reset Buffer job for resend.",
        );
      }

      jobs.push(resentJob);
      continue;
    }

    if (existingJob?.status === "ready" || existingJob?.status === "published") {
      const { data: existingReadyJob, error: existingReadyError } = await supabase
        .from("publishing_jobs")
        .select("*")
        .eq("id", existingJob.id)
        .single();

      if (existingReadyError || !existingReadyJob) {
        throw new Error(
          existingReadyError?.message || "Could not load Buffer-ready job.",
        );
      }

      jobs.push(existingReadyJob);
      continue;
    }

    const jobPayload = {
      user_id: userId,
      post_id: post.id,
      platform,
      status: "queued",
      scheduled_for: resolvedScheduledFor,
      error: null,
    };

    const jobResult = existingJob
      ? await supabase
          .from("publishing_jobs")
          .update(jobPayload)
          .eq("id", existingJob.id)
          .select()
          .single()
      : await supabase.from("publishing_jobs").insert(jobPayload).select().single();

    if (jobResult.error || !jobResult.data) {
      throw new Error(jobResult.error?.message || "Could not create schedule job.");
    }

    jobs.push(jobResult.data);
  }

  return {
    post: scheduledPost,
    jobs,
    selectedPlatforms: effectivePlatforms,
    scheduledFor: resolvedScheduledFor,
  };
}

export function getSelectedPublishingPlatforms(
  templateFields: Json,
  fallback: string,
): PublishPlatform[] {
  if (
    templateFields &&
    typeof templateFields === "object" &&
    !Array.isArray(templateFields) &&
    Array.isArray(templateFields.selected_platforms)
  ) {
    const selected = templateFields.selected_platforms.filter(
      (item): item is PublishPlatform =>
        typeof item === "string" && platforms.includes(item as PublishPlatform),
    );

    if (selected.length) {
      return selected;
    }
  }

  return platforms.includes(fallback as PublishPlatform)
    ? [fallback as PublishPlatform]
    : ["instagram"];
}

export function getConfiguredPublishingPlatforms(
  selectedPlatforms: PublishPlatform[],
  brandSlug?: BufferBrand | null,
): PublishPlatform[] {
  const status = getBufferEnvStatus();

  if (brandSlug) {
    return selectedPlatforms.filter((platform) =>
      Boolean(status.brandChannels[brandSlug]?.[platform]),
    );
  }

  const configured = status.connectedChannels;

  return selectedPlatforms.filter((platform) => configured.includes(platform));
}

function getPublishingBrandSlug(templateFields: Json): BufferBrand | null {
  if (!templateFields || typeof templateFields !== "object" || Array.isArray(templateFields)) {
    return null;
  }

  const value = templateFields.brand_slug;

  return value === "rallio" || value === "signal" ? value : null;
}

function formatBrandName(brandSlug: BufferBrand) {
  return brandSlug === "signal" ? "Signal" : "Rallio";
}

export async function getNextManualSlotForUser(
  supabase: ContentOsSupabaseClient,
  {
    userId,
    postId,
    platform,
  }: {
    userId: string;
    postId?: string;
    platform: PublishPlatform;
  },
) {
  const now = new Date();
  let query = supabase
    .from("publishing_jobs")
    .select("post_id, scheduled_for")
    .eq("user_id", userId)
    .eq("platform", platform)
    .in("status", ["queued", "ready", "published"])
    .gte("scheduled_for", now.toISOString());

  if (postId) {
    query = query.neq("post_id", postId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return getNextManualSlot(platform, {
    from: now,
    occupiedSlots: (data || []).map((job) => job.scheduled_for),
  });
}

export function getNextManualSlot(
  platform: PublishPlatform,
  {
    from = new Date(),
    occupiedSlots = [],
  }: {
    from?: Date;
    occupiedSlots?: string[];
  } = {},
) {
  const occupied = new Set(
    occupiedSlots
      .map((value) => {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
      })
      .filter((value): value is string => Boolean(value)),
  );
  const slots = getSlotHours(platform);
  const minTime = new Date(from.getTime() + 30 * 60 * 1000);
  const maxTime = new Date(
    from.getTime() + MANUAL_SLOT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  const localNow = getTimeZoneParts(from, MANUAL_SLOT_TIME_ZONE);

  for (let dayOffset = 0; dayOffset <= MANUAL_SLOT_WINDOW_DAYS; dayOffset += 1) {
    for (const hour of slots) {
      const candidate = zonedTimeToUtc(
        {
          year: localNow.year,
          month: localNow.month,
          day: localNow.day + dayOffset,
          hour,
          minute: 0,
        },
        MANUAL_SLOT_TIME_ZONE,
      );

      if (
        candidate >= minTime &&
        candidate <= maxTime &&
        !occupied.has(candidate.toISOString())
      ) {
        return candidate;
      }
    }
  }

  return minTime;
}

async function assertBufferQueueCapacity(
  supabase: ContentOsSupabaseClient,
  {
    userId,
    postId,
    platforms: selectedPlatforms,
  }: {
    userId: string;
    postId: string;
    platforms: PublishPlatform[];
  },
) {
  const channelQueueCap = getBufferChannelQueueCap();

  if (!channelQueueCap) {
    return;
  }

  const now = new Date().toISOString();

  for (const platform of selectedPlatforms) {
    const { data, error } = await supabase
      .from("publishing_jobs")
      .select("post_id, scheduled_for")
      .eq("user_id", userId)
      .eq("platform", platform)
      .in("status", ["queued", "ready", "published"])
      .gte("scheduled_for", now)
      .neq("post_id", postId);

    if (error) {
      throw new Error(error.message);
    }

    if ((data || []).length >= channelQueueCap) {
      throw new Error(
        `Buffer channel cap reached for ${platform}. Keep this post in Content OS until one queued Buffer post clears, or raise BUFFER_CHANNEL_QUEUE_CAP.`,
      );
    }
  }
}

function getFutureIso(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime()) || date.getTime() < Date.now() + 5 * 60 * 1000) {
    return null;
  }

  return date.toISOString();
}

async function cancelUnconfiguredPublishingJobs(
  supabase: ContentOsSupabaseClient,
  {
    userId,
    postId,
    platforms: skippedPlatforms,
  }: {
    userId: string;
    postId: string;
    platforms: PublishPlatform[];
  },
) {
  if (!skippedPlatforms.length) {
    return;
  }

  const { error } = await supabase
    .from("publishing_jobs")
    .update({
      status: "cancelled",
      error: "Buffer channel is not configured; skipped for Instagram-first publishing.",
    })
    .eq("post_id", postId)
    .eq("user_id", userId)
    .in("platform", skippedPlatforms)
    .in("status", ["queued", "failed"]);

  if (error) {
    throw new Error(error.message);
  }
}

function getSlotHours(platform: PublishPlatform) {
  if (platform === "x") {
    return [8, 11, 14, 17, 20];
  }

  if (platform === "linkedin") {
    return [9, 13, 16];
  }

  return [8, 12, 17];
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour === 24 ? 0 : values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function zonedTimeToUtc(
  local: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  },
  timeZone: string,
) {
  const utcGuess = new Date(
    Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, 0),
  );
  const offset = getTimeZoneOffsetMs(timeZone, utcGuess);
  const firstPass = new Date(utcGuess.getTime() - offset);
  const correctedOffset = getTimeZoneOffsetMs(timeZone, firstPass);

  return new Date(utcGuess.getTime() - correctedOffset);
}

function getTimeZoneOffsetMs(timeZone: string, date: Date) {
  const parts = getTimeZoneParts(date, timeZone);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return localAsUtc - date.getTime();
}
