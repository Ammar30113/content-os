import { PageHeader } from "@/components/page-header";
import { checkSupabaseProjectUrl } from "@/lib/supabase-safety";

const settings = [
  "Workspace profile",
  "Publishing channels",
  "Supabase connection",
  "OpenAI automation",
];

export default function SettingsPage() {
  const supabaseSafety = checkSupabaseProjectUrl();

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Settings"
        description="A placeholder settings area for internal configuration. No external services are connected yet."
      />
      <section className="space-y-6 p-6 lg:p-8">
        <div className="grid gap-4 lg:grid-cols-2">
          {settings.map((setting) => (
            <div
              key={setting}
              className="rounded border border-slate-200 bg-white p-5"
            >
              <h2 className="text-lg font-semibold text-slate-950">
                {setting}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Placeholder controls will be added here once the data model and
                auth boundary are defined.
              </p>
            </div>
          ))}
        </div>

        <div className="rounded border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-950">
            Supabase URL safety check
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {supabaseSafety.message}
          </p>
          <p className="mt-3 text-xs font-medium text-slate-500">
            This check is non-blocking while environment variables are empty.
          </p>
        </div>
      </section>
    </>
  );
}
