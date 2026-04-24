import Link from "next/link";
import { PageHeader } from "@/components/page-header";

const posts = [
  {
    id: "launch-notes-roundup",
    title: "Launch notes roundup",
    status: "Drafting",
    channel: "LinkedIn",
  },
  {
    id: "customer-proof-points",
    title: "Customer proof points",
    status: "Review",
    channel: "Newsletter",
  },
  {
    id: "april-distribution-plan",
    title: "April distribution plan",
    status: "Scheduled",
    channel: "Internal",
  },
];

export default function PostsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Production"
        title="Posts"
        description="A draft index for planned and in-progress content assets."
      />
      <section className="p-6 lg:p-8">
        <div className="overflow-hidden rounded border border-slate-200 bg-white">
          <div className="grid grid-cols-[1fr_110px_110px] gap-4 border-b border-slate-200 px-5 py-3 text-xs font-semibold uppercase text-slate-500">
            <span>Title</span>
            <span>Status</span>
            <span>Channel</span>
          </div>
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/app/posts/${post.id}`}
              className="grid grid-cols-[1fr_110px_110px] gap-4 border-b border-slate-100 px-5 py-4 text-sm transition last:border-b-0 hover:bg-slate-50"
            >
              <span className="font-medium text-slate-950">{post.title}</span>
              <span className="text-slate-600">{post.status}</span>
              <span className="text-slate-600">{post.channel}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
