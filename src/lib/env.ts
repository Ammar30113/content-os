import "server-only";

import {
  EXPECTED_SUPABASE_URL,
  REQUIRED_SUPABASE_PROJECT_REF,
  assertConfiguredSupabaseProjectUrl,
  checkSupabaseProjectUrl,
} from "@/lib/supabase-safety";

type EnvStatus = {
  ok: boolean;
  supabaseUrl: string | null;
  appUrl: string;
  projectRef: string | null;
  expectedProjectRef: string;
  expectedSupabaseUrl: string;
  message: string;
};

export type BufferPlatform = "instagram" | "x" | "linkedin";
export type BufferBrand = "rallio" | "signal";
type BufferChannelMap = Record<BufferPlatform, string | null>;
type BufferBrandChannelMap = Record<BufferBrand, BufferChannelMap>;

type BufferEnvStatus = {
  ok: boolean;
  accessTokenConfigured: boolean;
  organizationIdConfigured: boolean;
  channels: BufferChannelMap;
  brandChannels: BufferBrandChannelMap;
  connectedChannels: BufferPlatform[];
  connectedTargets: string[];
  missing: string[];
  message: string;
};

export function getAppUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL;

  if (configured && !isLocalhostUrl(configured)) {
    return trimTrailingSlash(configured);
  }

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    process.env.VERCEL_BRANCH_URL;

  if (vercelHost) {
    return `https://${trimTrailingSlash(vercelHost.replace(/^https?:\/\//i, ""))}`;
  }

  return configured ? trimTrailingSlash(configured) : "http://localhost:3000";
}

function isLocalhostUrl(value: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?/i.test(value);
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getEnvStatus(): EnvStatus {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
  const safety = checkSupabaseProjectUrl(supabaseUrl || undefined);
  const projectRef = supabaseUrl
    ? supabaseUrl.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i)?.[1] || null
    : null;

  return {
    ok:
      safety.ok &&
      Boolean(supabaseUrl) &&
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseUrl,
    appUrl: getAppUrl(),
    projectRef,
    expectedProjectRef: REQUIRED_SUPABASE_PROJECT_REF,
    expectedSupabaseUrl: EXPECTED_SUPABASE_URL,
    message: !supabaseUrl
      ? "NEXT_PUBLIC_SUPABASE_URL is not configured."
      : !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured."
        : safety.message,
  };
}

export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
  }

  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required.");
  }

  assertConfiguredSupabaseProjectUrl(url);

  return { url, anonKey };
}

export function getSupabaseServiceEnv() {
  const publicEnv = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required on the server.");
  }

  return { ...publicEnv, serviceRoleKey };
}

export function getOpenAIEnv() {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to generate content.");
  }

  return {
    apiKey,
    model,
  };
}

export function getBufferEnvStatus(): BufferEnvStatus {
  const brandChannels: BufferBrandChannelMap = {
    rallio: {
      instagram: process.env.BUFFER_RALLIO_INSTAGRAM_CHANNEL_ID || null,
      x: null,
      linkedin: null,
    },
    signal: {
      instagram: process.env.BUFFER_SIGNAL_INSTAGRAM_CHANNEL_ID || null,
      x: null,
      linkedin: null,
    },
  };
  const connectedEntries = Object.entries(brandChannels).flatMap(
    ([brand, channels]) =>
      (Object.entries(channels) as [BufferPlatform, string | null][])
        .filter(([, value]) => Boolean(value))
        .map(([platform]) => ({ brand: brand as BufferBrand, platform })),
  );
  const connectedTargets = connectedEntries.map(
    ({ brand, platform }) => `${formatBufferBrandName(brand)} ${platform}`,
  );
  const hasBrandChannelConflict = Boolean(
    brandChannels.rallio.instagram &&
      brandChannels.signal.instagram &&
      brandChannels.rallio.instagram === brandChannels.signal.instagram,
  );
  const connectedChannels = Array.from(
    new Set(connectedEntries.map(({ platform }) => platform)),
  );
  const required: [string, string | undefined][] = [
    ["BUFFER_ACCESS_TOKEN", process.env.BUFFER_ACCESS_TOKEN],
    ["BUFFER_ORGANIZATION_ID", process.env.BUFFER_ORGANIZATION_ID],
  ];
  const missing = required
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (!connectedTargets.length) {
    missing.push("BUFFER_RALLIO_INSTAGRAM_CHANNEL_ID or BUFFER_SIGNAL_INSTAGRAM_CHANNEL_ID");
  }

  const ok =
    Boolean(process.env.BUFFER_ACCESS_TOKEN) &&
    Boolean(process.env.BUFFER_ORGANIZATION_ID) &&
    connectedTargets.length > 0 &&
    !hasBrandChannelConflict;

  return {
    ok,
    accessTokenConfigured: Boolean(process.env.BUFFER_ACCESS_TOKEN),
    organizationIdConfigured: Boolean(process.env.BUFFER_ORGANIZATION_ID),
    channels: brandChannels.rallio,
    brandChannels,
    connectedChannels,
    connectedTargets,
    missing,
    message: hasBrandChannelConflict
      ? "Rallio and Signal must use different Buffer Instagram channel IDs."
      : ok
        ? `Buffer ready for ${connectedTargets.join(", ")}.`
        : `Missing ${missing.join(", ")}.`,
  };
}

export function getConfiguredBufferPlatforms(): BufferPlatform[] {
  return getBufferEnvStatus().connectedChannels;
}

export function getBufferChannelQueueCap() {
  const value = process.env.BUFFER_CHANNEL_QUEUE_CAP;

  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("BUFFER_CHANNEL_QUEUE_CAP must be a positive number.");
  }

  return Math.floor(parsed);
}

export function getBufferEnv() {
  const status = getBufferEnvStatus();
  const accessToken = process.env.BUFFER_ACCESS_TOKEN;
  const organizationId = process.env.BUFFER_ORGANIZATION_ID;

  if (!accessToken) {
    throw new Error("BUFFER_ACCESS_TOKEN is required to send posts to Buffer.");
  }

  if (!organizationId) {
    throw new Error("BUFFER_ORGANIZATION_ID is required to send posts to Buffer.");
  }

  return {
    accessToken,
    organizationId,
    channels: status.channels,
    brandChannels: status.brandChannels,
  };
}

export function getBufferChannelEnvName(
  platform: BufferPlatform,
  brand: BufferBrand = "rallio",
) {
  if (platform === "instagram") {
    return brand === "signal"
      ? "BUFFER_SIGNAL_INSTAGRAM_CHANNEL_ID"
      : "BUFFER_RALLIO_INSTAGRAM_CHANNEL_ID";
  }

  return `BUFFER_${brand.toUpperCase()}_${platform.toUpperCase()}_CHANNEL_ID`;
}

function formatBufferBrandName(brand: BufferBrand) {
  return brand === "signal" ? "Signal" : "Rallio";
}

export function assertContentOsSupabaseWriteSafety() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error(
      "Database writes are disabled because NEXT_PUBLIC_SUPABASE_URL is not configured.",
    );
  }

  assertConfiguredSupabaseProjectUrl(url);
}
