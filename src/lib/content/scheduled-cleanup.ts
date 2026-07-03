import "server-only";

import { deleteGeneratedPosts } from "@/lib/content/delete-posts";
import {
  BUFFER_SENT_POST_RETENTION_DAYS,
  isBufferScheduledPostExpired,
} from "@/lib/content/scheduled-retention";
import type { ContentOsSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

const DAY_MS = 24 * 60 * 60 * 1000;

type CleanupCandidate = {
  id: string;
  user_id: string;
  status: string;
  scheduled_for: string | null;
  template_fields: Json;
  created_at: string;
};

export async function deleteExpiredScheduledBufferPosts(
  supabase: ContentOsSupabaseClient,
  {
    now = new Date(),
    limit = 100,
  }: {
    now?: Date;
    limit?: number;
  } = {},
) {
  const createdBefore = new Date(
    now.getTime() - BUFFER_SENT_POST_RETENTION_DAYS * DAY_MS,
  ).toISOString();
  const { data: candidates, error } = await supabase
    .from("generated_posts")
    .select("id, user_id, status, scheduled_for, template_fields, created_at")
    .eq("status", "scheduled")
    .lte("created_at", createdBefore)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const expiredPosts = ((candidates || []) as CleanupCandidate[]).filter((post) =>
    isBufferScheduledPostExpired(post, now),
  );
  const postIdsByUser = expiredPosts.reduce((groups, post) => {
    const current = groups.get(post.user_id) || [];
    current.push(post.id);
    groups.set(post.user_id, current);
    return groups;
  }, new Map<string, string[]>());

  let deletedCount = 0;
  let storageRemovedCount = 0;
  const deletedIds: string[] = [];
  const storageWarnings: string[] = [];

  for (const [userId, postIds] of postIdsByUser.entries()) {
    // Isolate each user's cleanup so one failure does not abort the sweep for
    // every remaining user.
    try {
      const result = await deleteGeneratedPosts(supabase, { postIds, userId });
      deletedCount += result.deleted_count;
      storageRemovedCount += result.storage_removed_count;
      deletedIds.push(...result.deleted_ids);

      if (result.storage_warning) {
        storageWarnings.push(result.storage_warning);
      }
    } catch (error) {
      storageWarnings.push(
        `Cleanup failed for user ${userId}: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  }

  return {
    scanned_count: candidates?.length || 0,
    expired_count: expiredPosts.length,
    deleted_count: deletedCount,
    deleted_ids: deletedIds,
    storage_removed_count: storageRemovedCount,
    storage_warnings: storageWarnings,
  };
}
