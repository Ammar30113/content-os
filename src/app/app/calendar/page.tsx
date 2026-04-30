import Link from "next/link";

import { ConfigRequired } from "@/components/config-required";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getAuthenticatedPageContext } from "@/lib/auth";
import { getCalendarPosts } from "@/lib/content/queries";

type CalendarPost = {
  id: string;
  platform: string;
  status: string;
  headline: string | null;
  hook: string | null;
  image_url: string | null;
  scheduled_for: string | null;
  published_at: string | null;
  created_at: string;
};

export default async function CalendarPage() {
  const context = await getAuthenticatedPageContext("/app/calendar");

  if (!context.ok) {
    return <ConfigRequired message={context.message} />;
  }

  const { data: posts, error } = await getCalendarPosts(context.supabase);
  const groups = groupCalendarPosts((posts || []) as CalendarPost[]);

  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title="Calendar"
        description="Manual publishing queue for scheduled and published posts."
      />
      <section className="space-y-6 p-6 lg:p-8">
        {error ? <ErrorState message={error.message} /> : null}
        {groups.length ? (
          <div className="space-y-5">
            {groups.map((group) => (
              <section
                key={group.key}
                className="rounded border border-zinc-800 bg-zinc-950"
              >
                <div className="flex flex-col gap-1 border-b border-zinc-800 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b8c28a]">
                      {group.relativeLabel}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-white">
                      {group.label}
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-500">
                    {group.posts.length} post{group.posts.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="divide-y divide-zinc-800">
                  {group.posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/app/posts/${post.id}`}
                      className="grid gap-4 px-5 py-4 transition hover:bg-white/[0.03] md:grid-cols-[88px_1fr_110px_140px]"
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
                        <div className="mt-2 flex flex-wrap gap-2">
                          <StatusBadge status={post.status} />
                          <StatusBadge status={post.platform} />
                        </div>
                      </div>
                      <div className="text-sm">
                        <p className="text-zinc-500">Channel</p>
                        <p className="mt-1 font-medium text-zinc-200">
                          {post.platform}
                        </p>
                      </div>
                      <div className="text-sm">
                        <p className="text-zinc-500">Time</p>
                        <p className="mt-1 font-medium text-zinc-200">
                          {formatTime(post.scheduled_for || post.published_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No scheduled posts"
            description="Approve posts from the editor, set a manual slot, and they will appear here."
          />
        )}
      </section>
    </>
  );
}

function groupCalendarPosts(posts: CalendarPost[]) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const groups = new Map<
    string,
    {
      key: string;
      label: string;
      relativeLabel: string;
      posts: CalendarPost[];
      sortTime: number;
    }
  >();

  for (const post of posts) {
    const date = new Date(post.scheduled_for || post.published_at || post.created_at);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const group = groups.get(key) || {
      key,
      label: formatter.format(date),
      relativeLabel: getRelativeDayLabel(date, today, tomorrow),
      posts: [],
      sortTime: new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      ).getTime(),
    };

    group.posts.push(post);
    groups.set(key, group);
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      posts: group.posts.sort(
        (a, b) =>
          new Date(a.scheduled_for || a.published_at || a.created_at).getTime() -
          new Date(b.scheduled_for || b.published_at || b.created_at).getTime(),
      ),
    }))
    .sort((a, b) => a.sortTime - b.sortTime);
}

function getRelativeDayLabel(date: Date, today: Date, tomorrow: Date) {
  if (isSameDay(date, today)) {
    return "Today";
  }

  if (isSameDay(date, tomorrow)) {
    return "Tomorrow";
  }

  return "Upcoming";
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(value: string | null) {
  if (!value) {
    return "No time";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
