import { PageHeader } from "@/components/page-header";

const ideas = [
  "Founder perspective on content operations",
  "Repurpose customer calls into channel-ready drafts",
  "Weekly backlog review ritual",
  "Editorial quality checklist",
];

export default function IdeasPage() {
  return (
    <>
      <PageHeader
        eyebrow="Capture"
        title="Ideas"
        description="A placeholder backlog for raw ideas, source notes, and early content prompts."
      />
      <section className="p-6 lg:p-8">
        <div className="grid gap-4 lg:grid-cols-2">
          {ideas.map((idea, index) => (
            <article
              key={idea}
              className="rounded border border-slate-200 bg-white p-5"
            >
              <p className="text-sm font-medium text-teal-700">
                Idea {index + 1}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">
                {idea}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Placeholder record. Later this will track source, owner,
                priority, and conversion into a draft post.
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
