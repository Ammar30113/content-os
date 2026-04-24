import { ConfigRequired } from "@/components/config-required";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { IdeaGeneratorForm } from "@/components/idea-generator-form";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getAuthenticatedPageContext } from "@/lib/auth";
import { getRecentIdeas } from "@/lib/content/queries";

export default async function IdeasPage() {
  const context = await getAuthenticatedPageContext("/app/ideas");

  if (!context.ok) {
    return <ConfigRequired message={context.message} />;
  }

  const { data: ideas, error } = await getRecentIdeas(context.supabase);

  return (
    <>
      <PageHeader
        eyebrow="Generate"
        title="Ideas"
        description="Create a rough idea, URL, or brief and turn it into a complete social package with a branded image."
      />
      <section className="grid gap-6 p-6 lg:p-8 xl:grid-cols-[1fr_390px]">
        <IdeaGeneratorForm />

        <aside className="rounded border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-lg font-semibold text-white">Recent ideas</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Saved and generated briefs stay here for context.
          </p>
          {error ? <div className="mt-4"><ErrorState message={error.message} /></div> : null}
          {ideas?.length ? (
            <div className="mt-5 space-y-3">
              {ideas.map((idea) => (
                <article
                  key={idea.id}
                  className="rounded border border-zinc-800 bg-[#0a0a0b] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium text-white">{idea.title}</h3>
                    <StatusBadge status={idea.status} />
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-500">
                    {idea.brief || "No brief saved."}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="No ideas yet"
                description="Save an idea or generate a full package to populate the backlog."
              />
            </div>
          )}
        </aside>
      </section>
    </>
  );
}
