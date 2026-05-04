import "server-only";

import type { ContentOsSupabaseClient } from "@/lib/supabase/server";

type DeleteGeneratedPostsInput = {
  postIds: string[];
  userId: string;
};

export async function deleteGeneratedPosts(
  supabase: ContentOsSupabaseClient,
  { postIds, userId }: DeleteGeneratedPostsInput,
) {
  const uniquePostIds = Array.from(new Set(postIds));

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
    return {
      deleted_count: 0,
      deleted_ids: [],
      storage_removed_count: 0,
      storage_warning: null,
    };
  }

  const { data: mediaAssets, error: mediaError } = await supabase
    .from("media_assets")
    .select("storage_path")
    .eq("user_id", userId)
    .in("post_id", ownedPostIds);

  if (mediaError) {
    throw new Error(mediaError.message);
  }

  const storagePaths = Array.from(
    new Set((mediaAssets || []).map((asset) => asset.storage_path).filter(Boolean)),
  );
  let storageWarning: string | null = null;

  if (storagePaths.length) {
    const { error: storageError } = await supabase.storage
      .from("post-images")
      .remove(storagePaths);

    if (storageError) {
      storageWarning = storageError.message;
    }
  }

  const { data: deletedPosts, error: deleteError } = await supabase
    .from("generated_posts")
    .delete()
    .eq("user_id", userId)
    .in("id", ownedPostIds)
    .select("id");

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  return {
    deleted_count: deletedPosts?.length || 0,
    deleted_ids: (deletedPosts || []).map((post) => post.id),
    storage_removed_count: storageWarning ? 0 : storagePaths.length,
    storage_warning: storageWarning,
  };
}
