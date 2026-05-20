import { ConfigRequired } from "@/components/config-required";
import { IdeaGeneratorForm } from "@/components/idea-generator-form";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getAuthenticatedPageContext } from "@/lib/auth";
import { getGeneratedPosts } from "@/lib/content/queries";
import { getPostBrandSlug } from "@/lib/content/brand";

export default async function RallioPage() {
  const context = await getAuthenticatedPageContext("/app/rallio");

  if (!context.ok) {
    return <ConfigRequired message={context.message} />;
  }

  const { data: posts } = await getGeneratedPosts(context.supabase);
  const recentRallio = (posts || [])
    .filter((post) => getPostBrandSlug(post.template_fields) === "rallio")
    .slice(0, 4);

  return (
    <>
      <PageHeader
        eyebrow="Rallio"
        title="Rallio Content"
        description="Generate community-first Instagram posts for the Rallio taste map. Word of AI stays separate."
      />
      <section className="grid gap-6 p-6 lg:p-8 xl:grid-cols-[1fr_390px]">
        <IdeaGeneratorForm brandSlug="rallio" />

        <aside className="space-y-4">
          <section className="rounded border border-[#c8923a]/30 bg-[#1a130c] p-5">
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

          <section className="rounded border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-lg font-semibold text-white">Recent Rallio</h2>
            {recentRallio.length ? (
              <div className="mt-4 space-y-3">
                {recentRallio.map((post) => (
                  <article
                    key={post.id}
                    className="rounded border border-zinc-800 bg-[#0a0a0b] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="line-clamp-2 text-sm font-medium text-white">
                        {post.headline || post.hook || "Untitled Rallio post"}
                      </h3>
                      <StatusBadge status={post.status} />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Rallio posts will show here after the first generation.
              </p>
            )}
          </section>
        </aside>
      </section>
    </>
  );
}
