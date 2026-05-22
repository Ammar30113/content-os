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
type BufferChannelMap = Record<BufferPlatform, string | null>;

type BufferEnvStatus = {
  ok: boolean;
  accessTokenConfigured: boolean;
  organizationIdConfigured: boolean;
  channels: BufferChannelMap;
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
  const channels: BufferChannelMap = {
    instagram: process.env.BUFFER_RALLIO_INSTAGRAM_CHANNEL_ID || null,
    x: null,
    linkedin: null,
  };
  const connectedTargets = (
    Object.entries(channels) as [BufferPlatform, string | null][]
  )
    .filter(([, value]) => Boolean(value))
    .map(([platform]) => `Rallio ${platform}`);
  const connectedChannels = (
    Object.entries(channels) as [BufferPlatform, string | null][]
  )
    .filter(([, value]) => Boolean(value))
    .map(([platform]) => platform);
  const required: [string, string | undefined][] = [
    ["BUFFER_ACCESS_TOKEN", process.env.BUFFER_ACCESS_TOKEN],
    ["BUFFER_ORGANIZATION_ID", process.env.BUFFER_ORGANIZATION_ID],
  ];
  const missing = required
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (!connectedTargets.length) {
    missing.push("BUFFER_RALLIO_INSTAGRAM_CHANNEL_ID");
  }

  const ok =
    Boolean(process.env.BUFFER_ACCESS_TOKEN) &&
    Boolean(process.env.BUFFER_ORGANIZATION_ID) &&
    connectedTargets.length > 0;

  return {
    ok,
    accessTokenConfigured: Boolean(process.env.BUFFER_ACCESS_TOKEN),
    organizationIdConfigured: Boolean(process.env.BUFFER_ORGANIZATION_ID),
    channels,
    connectedChannels,
    connectedTargets,
    missing,
    message: ok
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
  };
}

export function getBufferChannelEnvName(platform: BufferPlatform) {
  return platform === "instagram"
    ? "BUFFER_RALLIO_INSTAGRAM_CHANNEL_ID"
    : `BUFFER_RALLIO_${platform.toUpperCase()}_CHANNEL_ID`;
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
