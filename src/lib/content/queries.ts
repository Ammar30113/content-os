import "server-only";

import type { ContentOsSupabaseClient } from "@/lib/supabase/server";

export async function getDashboardMetrics(supabase: ContentOsSupabaseClient) {
  const [ideas, draftPosts, scheduledPosts, publishedPosts, recentPosts] =
    await Promise.all([
      supabase.from("content_ideas").select("id", { count: "exact", head: true }),
      supabase
        .from("generated_posts")
        .select("id", { count: "exact", head: true })
        .eq("status", "draft"),
      supabase
        .from("generated_posts")
        .select("id", { count: "exact", head: true })
        .eq("status", "scheduled"),
      supabase
        .from("generated_posts")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      supabase
        .from("generated_posts")
        .select(
          "id, platform, post_type, status, headline, hook, image_url, scheduled_for, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  return {
    totalIdeas: ideas.count || 0,
    draftPosts: draftPosts.count || 0,
    scheduledPosts: scheduledPosts.count || 0,
    publishedPosts: publishedPosts.count || 0,
    recentPosts: recentPosts.data || [],
    error:
      ideas.error ||
      draftPosts.error ||
      scheduledPosts.error ||
      publishedPosts.error ||
      recentPosts.error,
  };
}

export async function getRecentIdeas(supabase: ContentOsSupabaseClient) {
  return supabase
    .from("content_ideas")
    .select("id, title, brief, source_url, status, created_at")
    .order("created_at", { ascending: false })
    .limit(8);
}

export async function getGeneratedPosts(supabase: ContentOsSupabaseClient) {
  return supabase
    .from("generated_posts")
    .select(
      "id, platform, post_type, status, image_status, image_error, video_status, video_url, headline, hook, caption, image_url, publish_error, scheduled_for, published_at, template_type, template_fields, created_at",
    )
    .order("created_at", { ascending: false });
}

export async function getGeneratedPost(
  supabase: ContentOsSupabaseClient,
  postId: string,
) {
  return supabase
    .from("generated_posts")
    .select("*")
    .eq("id", postId)
    .single();
}

export async function getCalendarPosts(supabase: ContentOsSupabaseClient) {
  return supabase
    .from("generated_posts")
    .select(
      "id, platform, status, headline, hook, image_url, scheduled_for, published_at, created_at",
    )
    .in("status", ["scheduled", "published"])
    .order("scheduled_for", { ascending: true, nullsFirst: false });
}
