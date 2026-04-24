import { ConfigRequired } from "@/components/config-required";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getAuthenticatedPageContext } from "@/lib/auth";
import { getEnvStatus } from "@/lib/env";

export default async function SettingsPage() {
  const context = await getAuthenticatedPageContext("/app/settings");
  const envStatus = getEnvStatus();

  if (!context.ok) {
    return <ConfigRequired message={context.message} />;
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Settings"
        description="Connection health, project safety, and placeholders for future publishing accounts."
      />
      <section className="grid gap-6 p-6 lg:grid-cols-[1fr_1fr] lg:p-8">
        <div className="rounded border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Supabase project safety
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Backend writes are blocked unless the configured URL includes
                the Content OS project ref.
              </p>
            </div>
            <StatusBadge status={envStatus.ok ? "approved" : "failed"} />
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <SettingRow label="Detected ref" value={envStatus.projectRef || "Not configured"} />
            <SettingRow label="Expected ref" value={envStatus.expectedProjectRef} />
            <SettingRow label="Expected URL" value={envStatus.expectedSupabaseUrl} />
            <SettingRow label="Message" value={envStatus.message} />
          </dl>
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-lg font-semibold text-white">App connection</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <SettingRow label="App URL" value={envStatus.appUrl} />
            <SettingRow label="Signed-in user" value={context.user.email || context.user.id} />
            <SettingRow label="Publishing APIs" value="Not connected in MVP" />
          </dl>
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-950 p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white">
            Future social accounts
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            The database includes a `social_accounts` table for future
            Instagram/X/LinkedIn OAuth work, but this MVP only schedules and
            tracks manual publishing.
          </p>
        </div>
      </section>
    </>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded border border-zinc-800 bg-[#0a0a0b] p-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="break-all font-medium text-zinc-200">{value}</dd>
    </div>
  );
}
