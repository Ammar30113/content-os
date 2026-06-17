import Link from "next/link";
import { Plus } from "lucide-react";

import { ConfigRequired } from "@/components/config-required";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { StatusCard } from "@/components/status-card";
import { getAuthenticatedPageContext } from "@/lib/auth";
import { getDashboardMetrics } from "@/lib/content/queries";

export default async function DashboardPage() {
  const context = await getAuthenticatedPageContext("/app/dashboard");

  if (!context.ok) {
    return <ConfigRequired message={context.message} />;
  }

  const metrics = await getDashboardMetrics(context.supabase);

  return (
    <>
      <PageHeader
        eyebrow="Content OS"
        title="Dashboard"
        description="Build Rallio and Signal Instagram systems from one workspace. Track ideas, drafts, scheduled posts, and recent packages."
        action={
          <Link
            href="/app/ideas"
            className="inline-flex h-10 items-center gap-2 rounded bg-[#C8923A] px-4 text-sm font-semibold text-[#0a0a0b]"
          >
            <Plus size={17} />
            New idea
          </Link>
        }
      />
      <section className="space-y-6 p-6 lg:p-8">
        {metrics.error ? <ErrorState message={metrics.error.message} /> : null}

        <div className="grid gap-4 md:grid-cols-4">
          <StatusCard
            label="Total ideas"
            value={String(metrics.totalIdeas)}
            detail="Captured raw inputs"
            tone="lime"
          />
          <StatusCard
            label="Draft posts"
            value={String(metrics.draftPosts)}
            detail="Need review/editing"
            tone="violet"
          />
          <StatusCard
            label="Scheduled"
            value={String(metrics.scheduledPosts)}
            detail="Queued for manual publish"
            tone="coral"
          />
          <StatusCard
            label="Published"
            value={String(metrics.publishedPosts)}
            detail="Marked shipped"
            tone="slate"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded border border-zinc-800 bg-zinc-950">
            <div className="border-b border-zinc-800 px-5 py-4">
              <h2 className="text-lg font-semibold text-white">Recent posts</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Open a package to edit copy, regenerate the image, or schedule it.
              </p>
            </div>
            {metrics.recentPosts.length ? (
              <div className="divide-y divide-zinc-800">
                {metrics.recentPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/app/posts/${post.id}`}
                    className="grid gap-3 px-5 py-4 transition hover:bg-white/[0.03] md:grid-cols-[1fr_120px_120px]"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {post.headline || post.hook || "Untitled generated post"}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {post.platform} / {post.post_type}
                      </p>
                    </div>
                    <StatusBadge status={post.status} />
                    <p className="text-sm text-zinc-500">
                      {post.scheduled_for
                        ? new Date(post.scheduled_for).toLocaleString()
                        : "Not scheduled"}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-5">
                <EmptyState
                  title="No generated posts yet"
                  description="Create your first idea and generate a content package to start the weekly queue."
                  action={
                    <Link
                      href="/app/ideas"
                      className="inline-flex h-10 items-center rounded bg-[#C8923A] px-4 text-sm font-semibold text-[#0a0a0b]"
                    >
                      Create first idea
                    </Link>
                  }
                />
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <section className="rounded border border-[#C8923A]/30 bg-[#1a130c] p-5">
              <h2 className="text-lg font-semibold text-[#f5ebdc]">
                Rallio rules
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[#d8c9b4]">
                <p>Feed goal: grow community demand before product launch.</p>
                <p>Default rhythm: regular quote, spot card, receipt, manifesto/BTS.</p>
                <p>Category focus: food and drink spots people recommend twice.</p>
                <p>Tone: local, taste-first, regular-aware.</p>
                <p>Avoid generic launch copy, exclamation points, perks, rewards, and instant-access claims.</p>
              </div>
            </section>

            <section className="rounded border border-zinc-800 bg-zinc-950 p-5">
              <h2 className="text-lg font-semibold text-white">Funnel doors</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-400">
                <p>
                  <span className="text-white">Founding supporter:</span> grow
                  the early supporter list.
                </p>
                <p>
                  <span className="text-white">Taste map:</span> drive saves,
                  guide requests, and link-in-bio waitlist joins.
                </p>
                <p>
                  <span className="text-white">Owner profile:</span> occasional
                  owner-utility posts for community-added spots.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </>
  );
}
