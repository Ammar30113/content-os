import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ConfigRequired } from "@/components/config-required";
import { ErrorState } from "@/components/error-state";
import { PageHeader } from "@/components/page-header";
import { PostEditorForm } from "@/components/post-editor-form";
import { StatusBadge } from "@/components/status-badge";
import { getAuthenticatedPageContext } from "@/lib/auth";
import { getGeneratedPost } from "@/lib/content/queries";

type PostDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;
  const context = await getAuthenticatedPageContext(`/app/posts/${id}`);

  if (!context.ok) {
    return <ConfigRequired message={context.message} />;
  }

  const { data: post, error } = await getGeneratedPost(context.supabase, id);

  if (error) {
    if (error.code === "PGRST116") {
      notFound();
    }

    return (
      <section className="p-6 lg:p-8">
        <ErrorState message={error.message} />
      </section>
    );
  }

  if (!post) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow="Editor"
        title={post.headline || post.hook || "Generated post"}
        description={
          post.post_type === "reel"
            ? "Edit the Reel package, copy the Veo prompt, attach the exported video, approve, schedule, or mark published."
            : "Edit the package, adjust template fields, regenerate the image, upload your own image, approve, schedule, or mark published."
        }
        action={
          <Link
            href="/app/posts"
            className="inline-flex h-10 items-center gap-2 rounded border border-zinc-700 px-4 text-sm font-semibold text-white"
          >
            <ArrowLeft size={17} />
            Back to posts
          </Link>
        }
      />
      <section className="space-y-5 p-6 lg:p-8">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={post.status} />
          <StatusBadge
            status={post.post_type === "reel" ? post.video_status : post.image_status}
          />
          <StatusBadge status={post.platform} />
          <StatusBadge status={post.post_type} />
        </div>
        <PostEditorForm post={post} />
      </section>
    </>
  );
}
