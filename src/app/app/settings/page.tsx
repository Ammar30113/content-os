import { ConfigRequired } from "@/components/config-required";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getAuthenticatedPageContext } from "@/lib/auth";
import { getEnvStatus } from "@/lib/env";
import type { ContentOsSupabaseClient } from "@/lib/supabase/server";

const bufferEnvVars = [
  "BUFFER_ACCESS_TOKEN",
  "BUFFER_INSTAGRAM_CHANNEL_ID",
  "BUFFER_X_CHANNEL_ID",
  "BUFFER_LINKEDIN_CHANNEL_ID",
];

export default async function SettingsPage() {
  const context = await getAuthenticatedPageContext("/app/settings");
  const envStatus = getEnvStatus();

  if (!context.ok) {
    return <ConfigRequired message={context.message} />;
  }

  const bucketStatus = await getBucketStatus(context.supabase);
  const openAIConfigured = Boolean(process.env.OPENAI_API_KEY);
  const openAIModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Settings"
        description="Connection health, project safety, generation config, and future publishing readiness."
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">App health</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Core services needed for the manual workflow MVP.
              </p>
            </div>
            <StatusBadge
              status={envStatus.ok && openAIConfigured && bucketStatus.ok ? "approved" : "failed"}
            />
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <SettingRow label="App URL" value={envStatus.appUrl} />
            <SettingRow label="Signed-in user" value={context.user.email || context.user.id} />
            <SettingRow label="OpenAI model" value={openAIModel} />
            <SettingRow
              label="OpenAI key"
              value={openAIConfigured ? "Configured" : "Missing"}
            />
            <SettingRow
              label="Storage bucket"
              value={bucketStatus.message}
            />
            <SettingRow label="Publishing mode" value="Manual handoff" />
          </dl>
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-950 p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Buffer autoposting checklist
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Disabled for this MVP. These are the environment variables to
                add when we wire the next milestone.
              </p>
            </div>
            <StatusBadge status="draft" />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {bufferEnvVars.map((name) => (
              <SettingRow
                key={name}
                label={name}
                value={process.env[name] ? "Configured" : "Not connected yet"}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

async function getBucketStatus(supabase: ContentOsSupabaseClient) {
  const { data, error } = await supabase.storage.getBucket("post-images");

  if (error || !data) {
    return {
      ok: false,
      message: error?.message || "post-images bucket unavailable",
    };
  }

  return {
    ok: true,
    message: data.public ? "post-images public bucket ready" : "post-images bucket ready",
  };
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded border border-zinc-800 bg-[#0a0a0b] p-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="break-all font-medium text-zinc-200">{value}</dd>
    </div>
  );
}
