import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusCard } from "@/components/status-card";

const queue = [
  {
    title: "Launch notes roundup",
    owner: "Editorial",
    state: "Drafting",
  },
  {
    title: "Customer proof points",
    owner: "Growth",
    state: "Needs brief",
  },
  {
    title: "April distribution plan",
    owner: "Ops",
    state: "Review",
  },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Dashboard"
        description="A compact operating view for the content pipeline. Data is mocked until the persistence layer is connected."
      />
      <section className="space-y-6 p-6 lg:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          <StatusCard
            label="Ideas"
            value="42"
            detail="9 ready to become briefs"
            tone="teal"
          />
          <StatusCard
            label="Active posts"
            value="18"
            detail="4 waiting for review"
            tone="blue"
          />
          <StatusCard
            label="Scheduled"
            value="12"
            detail="Across the next two weeks"
            tone="amber"
          />
        </div>

        <div className="rounded border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Priority queue
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Placeholder content for the first internal workflow.
              </p>
            </div>
            <Link
              href="/app/posts"
              className="inline-flex h-10 items-center justify-center rounded border border-slate-300 px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
            >
              View posts
            </Link>
          </div>
          <div className="divide-y divide-slate-200">
            {queue.map((item) => (
              <div
                key={item.title}
                className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_120px_120px] sm:items-center"
              >
                <p className="font-medium text-slate-950">{item.title}</p>
                <p className="text-sm text-slate-500">{item.owner}</p>
                <p className="w-fit rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {item.state}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
