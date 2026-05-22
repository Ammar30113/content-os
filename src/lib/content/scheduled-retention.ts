import type { Json } from "@/types/database";

export const BUFFER_SENT_POST_RETENTION_DAYS = 10;

const DAY_MS = 24 * 60 * 60 * 1000;
const POST_PUBLISH_GRACE_MS = DAY_MS;

type BufferScheduledPost = {
  status: string;
  scheduled_for: string | null;
  template_fields: Json;
  created_at?: string;
};

export function isBufferScheduledPost(post: BufferScheduledPost) {
  return post.status === "scheduled" && getBufferPostEntries(post).length > 0;
}

export function isBufferScheduledPostExpired(
  post: BufferScheduledPost,
  now = new Date(),
) {
  const clearAt = getBufferScheduledClearAt(post);

  return Boolean(clearAt && new Date(clearAt).getTime() <= now.getTime());
}

export function getBufferScheduledClearAt(post: BufferScheduledPost) {
  const sentAt = getBufferSentAt(post);

  if (!sentAt) {
    return null;
  }

  const sentDate = parseDate(sentAt);

  if (!sentDate) {
    return null;
  }

  const scheduledDate = parseDate(post.scheduled_for);
  const sentExpiry = sentDate.getTime() + BUFFER_SENT_POST_RETENTION_DAYS * DAY_MS;
  const publishSafeExpiry = scheduledDate
    ? scheduledDate.getTime() + POST_PUBLISH_GRACE_MS
    : 0;

  return new Date(Math.max(sentExpiry, publishSafeExpiry)).toISOString();
}

export function getBufferSentAt(post: BufferScheduledPost) {
  const bufferEntries = getBufferPostEntries(post);

  if (!bufferEntries.length) {
    return null;
  }

  const sentDates = bufferEntries
    .map((entry) => entry.sent_at)
    .filter((value): value is string => typeof value === "string" && Boolean(value))
    .map(parseDate)
    .filter((date): date is Date => Boolean(date));

  if (!sentDates.length) {
    return post.scheduled_for || post.created_at || null;
  }

  return new Date(
    Math.max(...sentDates.map((date) => date.getTime())),
  ).toISOString();
}

function getBufferPostEntries(post: BufferScheduledPost) {
  const fields = isRecord(post.template_fields) ? post.template_fields : {};
  const bufferPosts = isRecord(fields.buffer_posts) ? fields.buffer_posts : {};

  return Object.values(bufferPosts)
    .filter(isRecord)
    .filter(
      (entry) =>
        entry.status === "ready" || typeof entry.buffer_post_id === "string",
    );
}

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isRecord(value: Json | undefined): value is Record<string, Json | undefined> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
