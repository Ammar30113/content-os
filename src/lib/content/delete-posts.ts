import "server-only";

import type { ContentOsSupabaseClient } from "@/lib/supabase/server";

type DeleteGeneratedPostsInput = {
  postIds: string[];
  userId: string;
  // When true (default), refuse to delete a post that still has a live Buffer
  // handoff — a job that is mid-send (`processing`) or already handed to Buffer
  // and awaiting a future publish (`ready` with a future slot). Deleting those
  // would let Buffer publish to Instagram while Content OS loses the record and
  // removes the backing image, so callers must cancel in Buffer first. Retention
  // cleanup only targets posts whose Buffer slot has already cleared, so those
  // are never blocked by this guard.
  guardActiveBufferJobs?: boolean;
};

export type DeleteGeneratedPostsResult = {
  deleted_count: number;
  deleted_ids: string[];
  storage_removed_count: number;
  storage_warning: string | null;
  blocked_ids: string[];
};

export async function deleteGeneratedPosts(
  supabase: ContentOsSupabaseClient,
  { postIds, userId, guardActiveBufferJobs = true }: DeleteGeneratedPostsInput,
): Promise<DeleteGeneratedPostsResult> {
  const uniquePostIds = Array.from(new Set(postIds));

  const emptyResult: DeleteGeneratedPostsResult = {
    deleted_count: 0,
    deleted_ids: [],
    storage_removed_count: 0,
    storage_warning: null,
    blocked_ids: [],
  };

  if (!uniquePostIds.length) {
    return emptyResult;
  }

  const { data: ownedPosts, error: postsError } = await supabase
    .from("generated_posts")
    .select("id")
    .eq("user_id", userId)
    .in("id", uniquePostIds);

  if (postsError) {
    throw new Error(postsError.message);
  }

  const ownedPostIds = (ownedPosts || []).map((post) => post.id);

  if (!ownedPostIds.length) {
    return emptyResult;
  }

  // Guard: never delete a post whose Buffer handoff is still live.
  const blockedIds = guardActiveBufferJobs
    ? await getPostIdsWithLiveBufferJobs(supabase, { userId, postIds: ownedPostIds })
    : [];
  const blockedSet = new Set(blockedIds);
  const deletablePostIds = ownedPostIds.filter((id) => !blockedSet.has(id));

  if (!deletablePostIds.length) {
    return { ...emptyResult, blocked_ids: blockedIds };
  }

  // Read storage paths BEFORE deleting the posts: deleting a post cascades its
  // media_assets rows away, so we would otherwise lose the paths we need to
  // clean up from storage.
  const { data: mediaAssets, error: mediaError } = await supabase
    .from("media_assets")
    .select("storage_path")
    .eq("user_id", userId)
    .in("post_id", deletablePostIds);

  if (mediaError) {
    throw new Error(mediaError.message);
  }

  const storagePaths = Array.from(
    new Set((mediaAssets || []).map((asset) => asset.storage_path).filter(Boolean)),
  );

  // Delete the database rows FIRST. The generated_posts delete cascades to
  // publishing_jobs and media_assets, so the DB is left consistent in a single
  // atomic statement. Only then do we best-effort remove storage — an orphaned
  // storage object is invisible, whereas a surviving row with a dead public_url
  // is a user-facing broken image.
  const { data: deletedPosts, error: deleteError } = await supabase
    .from("generated_posts")
    .delete()
    .eq("user_id", userId)
    .in("id", deletablePostIds)
    .select("id");

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  let storageRemovedCount = 0;
  let storageWarning: string | null = null;

  if (storagePaths.length) {
    const { error: storageError } = await supabase.storage
      .from("post-images")
      .remove(storagePaths);

    if (storageError) {
      // Do not throw — the rows are already gone. Surface the orphaned storage
      // so a caller/operator can retry the cleanup instead of failing the whole
      // delete after the DB is already consistent.
      storageWarning = `Deleted posts but could not remove ${storagePaths.length} storage object(s): ${storageError.message}`;
    } else {
      storageRemovedCount = storagePaths.length;
    }
  }

  return {
    deleted_count: deletedPosts?.length || 0,
    deleted_ids: (deletedPosts || []).map((post) => post.id),
    storage_removed_count: storageRemovedCount,
    storage_warning: storageWarning,
    blocked_ids: blockedIds,
  };
}

async function getPostIdsWithLiveBufferJobs(
  supabase: ContentOsSupabaseClient,
  { userId, postIds }: { userId: string; postIds: string[] },
): Promise<string[]> {
  const { data: jobs, error } = await supabase
    .from("publishing_jobs")
    .select("post_id, status, scheduled_for")
    .eq("user_id", userId)
    .in("post_id", postIds)
    .in("status", ["processing", "ready"]);

  if (error) {
    throw new Error(error.message);
  }

  const now = Date.now();
  const blocked = new Set<string>();

  for (const job of jobs || []) {
    if (!job.post_id) {
      continue;
    }

    if (job.status === "processing") {
      blocked.add(job.post_id);
      continue;
    }

    // `ready` means the post is already in Buffer. It is only dangerous to
    // delete while the scheduled publish is still in the future; once the slot
    // has passed Buffer has already fired and the record is safe to remove
    // (this is what retention cleanup relies on).
    const scheduledFor = job.scheduled_for ? new Date(job.scheduled_for).getTime() : null;

    if (scheduledFor !== null && !Number.isNaN(scheduledFor) && scheduledFor > now) {
      blocked.add(job.post_id);
    }
  }

  return Array.from(blocked);
}
