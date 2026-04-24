import Link from "next/link";
import { PageHeader } from "@/components/page-header";

type PostDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;
  const title = id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <>
      <PageHeader
        eyebrow="Production"
        title={title}
        description="A placeholder detail route for editing post metadata, draft content, and publishing readiness."
      />
      <section className="space-y-6 p-6 lg:p-8">
        <Link
          href="/app/posts"
          className="inline-flex h-10 items-center justify-center rounded border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
        >
          Back to posts
        </Link>
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <article className="rounded border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Draft canvas
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This area will become the post editor. For now it keeps the route
              structure and dynamic ID handling in place.
            </p>
            <div className="mt-5 rounded border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-500">
              Post ID: <span className="font-mono text-slate-700">{id}</span>
            </div>
          </article>
          <aside className="rounded border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-950">Readiness</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-medium text-slate-900">Draft</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Owner</dt>
                <dd className="font-medium text-slate-900">Unassigned</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Channel</dt>
                <dd className="font-medium text-slate-900">TBD</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>
    </>
  );
}
