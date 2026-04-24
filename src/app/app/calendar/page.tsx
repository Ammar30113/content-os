import Link from "next/link";

import { ConfigRequired } from "@/components/config-required";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getAuthenticatedPageContext } from "@/lib/auth";
import { getCalendarPosts } from "@/lib/content/queries";

export default async function CalendarPage() {
  const context = await getAuthenticatedPageContext("/app/calendar");

  if (!context.ok) {
    return <ConfigRequired message={context.message} />;
  }

  const { data: posts, error } = await getCalendarPosts(context.supabase);

  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title="Calendar"
        description="Scheduled and published posts. Direct publishing is intentionally not connected yet."
      />
      <section className="space-y-6 p-6 lg:p-8">
        {error ? <ErrorState message={error.message} /> : null}
        {posts?.length ? (
          <div className="rounded border border-zinc-800 bg-zinc-950">
            <div className="grid grid-cols-[120px_1fr_110px_130px] gap-4 border-b border-zinc-800 px-5 py-3 text-xs font-semibold uppercase text-zinc-500">
              <span>Image</span>
              <span>Post</span>
              <span>Platform</span>
              <span>Time</span>
            </div>
            <div className="divide-y divide-zinc-800">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/app/posts/${post.id}`}
                  className="grid grid-cols-[120px_1fr_110px_130px] gap-4 px-5 py-4 transition hover:bg-white/[0.03]"
                >
                  <div className="size-20 overflow-hidden rounded bg-black">
                    {post.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.image_url}
                        alt={post.headline || "Scheduled post"}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {post.headline || post.hook || "Untitled scheduled post"}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <StatusBadge status={post.status} />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-zinc-300">
                    {post.platform}
                  </p>
                  <p className="text-sm leading-6 text-zinc-500">
                    {post.scheduled_for
                      ? new Date(post.scheduled_for).toLocaleString()
                      : post.published_at
                        ? new Date(post.published_at).toLocaleString()
                        : "No time"}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No scheduled posts"
            description="Schedule approved posts from the post grid or editor. They will appear here for manual publishing."
          />
        )}
      </section>
    </>
  );
}
