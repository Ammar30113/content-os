import Link from "next/link";
import { Plus } from "lucide-react";

import { ConfigRequired } from "@/components/config-required";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { PostsWorkflowList } from "@/components/posts-workflow-list";
import { getAuthenticatedPageContext } from "@/lib/auth";
import { getGeneratedPosts } from "@/lib/content/queries";

export default async function PostsPage() {
  const context = await getAuthenticatedPageContext("/app/posts");

  if (!context.ok) {
    return <ConfigRequired message={context.message} />;
  }

  const { data: posts, error } = await getGeneratedPosts(context.supabase);

  return (
    <>
      <PageHeader
        eyebrow="Review"
        title="Posts"
        description="Generated packages, branded images, approvals, and schedules for the Word of AI queue."
        action={
          <Link
            href="/app/ideas"
            className="inline-flex h-10 items-center gap-2 rounded bg-[#d4ff00] px-4 text-sm font-semibold text-[#0a0a0b]"
          >
            <Plus size={17} />
            New idea
          </Link>
        }
      />
      <section className="space-y-6 p-6 lg:p-8">
        {error ? <ErrorState message={error.message} /> : null}
        {posts?.length ? (
          <PostsWorkflowList posts={posts} />
        ) : (
          <EmptyState
            title="No posts generated yet"
            description="Generate a content package from the Ideas page. The post grid will show thumbnails, statuses, and scheduling controls."
            action={
              <Link
                href="/app/ideas"
                className="inline-flex h-10 items-center rounded bg-[#d4ff00] px-4 text-sm font-semibold text-[#0a0a0b]"
              >
                Generate first post
              </Link>
            }
          />
        )}
      </section>
    </>
  );
}
