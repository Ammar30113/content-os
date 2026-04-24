import Link from "next/link";
import { Plus } from "lucide-react";

import { ConfigRequired } from "@/components/config-required";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { PostCardActions } from "@/components/post-card-actions";
import { StatusBadge } from "@/components/status-badge";
import { getAuthenticatedPageContext } from "@/lib/auth";
import { formatTemplateName } from "@/lib/content/types";
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
          <div className="grid gap-5 xl:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post.id}
                className="overflow-hidden rounded border border-zinc-800 bg-zinc-950"
              >
                <Link href={`/app/posts/${post.id}`} className="block">
                  <div className="grid gap-0 md:grid-cols-[210px_1fr]">
                    <div className="aspect-square bg-black">
                      {post.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.image_url}
                          alt={post.headline || "Post thumbnail"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center p-4 text-center text-xs leading-5 text-zinc-500">
                          {post.image_status === "failed"
                            ? "Image failed"
                            : "No image yet"}
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status={post.status} />
                        <StatusBadge status={post.image_status} />
                      </div>
                      <h2 className="mt-4 text-xl font-semibold leading-tight text-white">
                        {post.headline || post.hook || "Untitled post"}
                      </h2>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-500">
                        {post.caption || post.hook || "Open to edit this package."}
                      </p>
                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="text-zinc-500">Platform</dt>
                          <dd className="mt-1 font-medium text-zinc-200">
                            {post.platform}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-zinc-500">Type</dt>
                          <dd className="mt-1 font-medium text-zinc-200">
                            {post.post_type}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-zinc-500">Template</dt>
                          <dd className="mt-1 font-medium text-zinc-200">
                            {formatTemplateName(post.template_type)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-zinc-500">Schedule</dt>
                          <dd className="mt-1 font-medium text-zinc-200">
                            {post.scheduled_for
                              ? new Date(post.scheduled_for).toLocaleString()
                              : "Not set"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </Link>
                <div className="p-5">
                  <PostCardActions
                    postId={post.id}
                    templateType={post.template_type}
                    templateFields={post.template_fields}
                  />
                </div>
              </article>
            ))}
          </div>
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
