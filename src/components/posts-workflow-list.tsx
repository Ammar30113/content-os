"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Send, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { PostCardActions } from "@/components/post-card-actions";
import { StatusBadge } from "@/components/status-badge";
import { formatTemplateName } from "@/lib/content/types";
import { readApiJson } from "@/lib/http/read-api-json";
import type { Json } from "@/types/database";

type PostListItem = {
  id: string;
  platform: string;
  post_type: string;
  status: string;
  image_status: string;
  headline: string | null;
  hook: string | null;
  caption: string | null;
  image_url: string | null;
  publish_error: string | null;
  scheduled_for: string | null;
  published_at: string | null;
  template_type: string | null;
  template_fields: Json;
  created_at: string;
};

type BulkState = {
  loading: string | null;
  message: string | null;
  details: string[];
  error: string | null;
};

type BulkSummary = {
  message: string;
  details?: string[];
};

export function PostsWorkflowList({ posts }: { posts: PostListItem[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [state, setState] = useState<BulkState>({
    loading: null,
    message: null,
    details: [],
    error: null,
  });
  const router = useRouter();
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  function togglePost(postId: string) {
    setSelectedIds((current) =>
      current.includes(postId)
        ? current.filter((id) => id !== postId)
        : [...current, postId],
    );
  }

  function selectAllVisible() {
    setSelectedIds(posts.map((post) => post.id));
  }

  async function runBulkAction(
    loading: string,
    endpoint: string,
    successMessage: (payload: Record<string, unknown>) => string | BulkSummary,
  ) {
    if (!selectedIds.length) {
      setState({
        loading: null,
        message: null,
        details: [],
        error: "Select posts first.",
      });
      return;
    }

    setState({ loading, message: null, details: [], error: null });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_ids: selectedIds }),
      });
      const payload = await readApiJson<Record<string, unknown>>(response);

      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string" ? payload.error : `${loading} failed.`,
        );
      }

      const summary = normalizeBulkSummary(successMessage(payload));
      setSelectedIds([]);
      setState({
        loading: null,
        message: summary.message,
        details: summary.details || [],
        error: null,
      });
      router.refresh();
    } catch (error) {
      setState({
        loading: null,
        message: null,
        details: [],
        error: error instanceof Error ? error.message : `${loading} failed.`,
      });
    }
  }

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-10 rounded border border-zinc-800 bg-[#0a0a0b]/95 p-4 backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              {selectedIds.length} selected
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Bulk send approves, uses the next manual Buffer slot, sends to
              Buffer, then marks the Content OS post complete.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectAllVisible}
              disabled={Boolean(state.loading) || selectedIds.length === posts.length}
              className="inline-flex h-9 items-center justify-center rounded border border-zinc-700 px-3 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-50"
            >
              Select visible
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              disabled={Boolean(state.loading) || !selectedIds.length}
              className="inline-flex h-9 items-center justify-center gap-2 rounded border border-zinc-700 px-3 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-50"
            >
              <X size={15} />
              Clear
            </button>
            <button
              type="button"
              disabled={Boolean(state.loading) || !selectedIds.length}
              onClick={() =>
                runBulkAction(
                  "Approving selected",
                  "/api/posts/bulk/approve",
                  (payload) =>
                    `Approved ${String(payload.approved_count || 0)} posts.`,
                )
              }
              className="inline-flex h-9 items-center justify-center gap-2 rounded border border-zinc-700 px-3 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-50"
            >
              <Check size={15} />
              {state.loading === "Approving selected"
                ? "Approving..."
                : "Approve selected"}
            </button>
            <button
              type="button"
              disabled={Boolean(state.loading) || !selectedIds.length}
              onClick={() =>
                runBulkAction(
                  "Sending selected",
                  "/api/posts/bulk/send-to-buffer",
                  (payload) => {
                    const sent = String(payload.sent_count || 0);
                    const failed = Number(payload.failed_count || 0);
                    const details = getBulkFailureDetails(payload);

                    return failed
                      ? {
                          message: `Sent ${sent} posts to Buffer. ${failed} need review.`,
                          details,
                        }
                      : `Sent ${sent} posts to Buffer and marked them complete.`;
                  },
                )
              }
              className="inline-flex h-9 items-center justify-center gap-2 rounded bg-[#d4ff00] px-3 text-xs font-semibold text-[#0a0a0b] transition hover:bg-[#e7ff68] disabled:opacity-50"
            >
              <Send size={15} />
              {state.loading === "Sending selected"
                ? "Sending..."
                : "Send selected to Buffer"}
            </button>
            <button
              type="button"
              disabled={Boolean(state.loading) || !selectedIds.length}
              onClick={() => {
                if (
                  !window.confirm(
                    `Delete ${selectedIds.length} selected post${
                      selectedIds.length === 1 ? "" : "s"
                    }? This removes related schedule jobs and generated image records.`,
                  )
                ) {
                  return;
                }

                runBulkAction(
                  "Deleting selected",
                  "/api/posts/bulk/delete",
                  (payload) => {
                    const deleted = String(payload.deleted_count || 0);
                    const warning =
                      typeof payload.storage_warning === "string"
                        ? ` Storage cleanup warning: ${payload.storage_warning}`
                        : "";

                    return `Deleted ${deleted} post${deleted === "1" ? "" : "s"}.${warning}`;
                  },
                );
              }}
              className="inline-flex h-9 items-center justify-center gap-2 rounded border border-red-500/40 px-3 text-xs font-semibold text-red-200 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 size={15} />
              {state.loading === "Deleting selected" ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
        {state.message ? (
          <div className="mt-3 rounded border border-[#d4ff00]/30 bg-[#d4ff00]/10 p-3 text-sm text-[#ecff8a]">
            <p>{state.message}</p>
            {state.details.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-[#f2ffb8]">
                {state.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        {state.error ? (
          <p className="mt-3 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
            {state.error}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {posts.map((post) => (
          <article
            key={post.id}
            className="overflow-hidden rounded border border-zinc-800 bg-zinc-950"
          >
            <div className="flex items-center justify-between border-b border-zinc-900 px-4 py-3">
              <label className="inline-flex items-center gap-3 text-sm font-medium text-zinc-300">
                <input
                  type="checkbox"
                  checked={selectedSet.has(post.id)}
                  onChange={() => togglePost(post.id)}
                  className="h-4 w-4 accent-[#d4ff00]"
                />
                Select
              </label>
              <span className="text-xs text-zinc-600">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
            <Link href={`/app/posts/${post.id}`} className="block">
              <div className="grid gap-0 md:grid-cols-[210px_1fr]">
                <div className="aspect-square bg-black">
                  {post.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.image_url}
                      alt={post.headline || "Post thumbnail"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center p-4 text-center text-xs leading-5 text-zinc-500">
                      {post.image_status === "failed"
                        ? "Image failed"
                        : "No image yet"}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={post.status} />
                    <StatusBadge status={post.image_status} />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold leading-tight text-white">
                    {post.headline || post.hook || "Untitled post"}
                  </h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-500">
                    {post.caption || post.hook || "Open to edit this package."}
                  </p>
                  {post.publish_error ? (
                    <p className="mt-3 rounded border border-red-500/30 bg-red-500/10 p-3 text-xs leading-5 text-red-100">
                      Buffer review: {post.publish_error}
                    </p>
                  ) : null}
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-zinc-500">Platform</dt>
                      <dd className="mt-1 font-medium text-zinc-200">
                        {post.platform}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Type</dt>
                      <dd className="mt-1 font-medium text-zinc-200">
                        {post.post_type}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Template</dt>
                      <dd className="mt-1 font-medium text-zinc-200">
                        {formatTemplateName(post.template_type)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Schedule</dt>
                      <dd className="mt-1 font-medium text-zinc-200">
                        {post.scheduled_for
                          ? new Date(post.scheduled_for).toLocaleString()
                          : "Auto slot"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </Link>
            <div className="p-5">
              <PostCardActions
                postId={post.id}
                templateType={post.template_type}
                templateFields={post.template_fields}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function normalizeBulkSummary(result: string | BulkSummary): BulkSummary {
  if (typeof result === "string") {
    return { message: result };
  }

  return result;
}

function getBulkFailureDetails(payload: Record<string, unknown>) {
  const results = Array.isArray(payload.results) ? payload.results : [];

  return results
    .filter(
      (result): result is Record<string, unknown> =>
        typeof result === "object" && result !== null && !Array.isArray(result),
    )
    .filter((result) => result.ok === false)
    .slice(0, 6)
    .map((result) => {
      const shortId =
        typeof result.post_id === "string" ? result.post_id.slice(0, 8) : "post";
      const error =
        typeof result.error === "string"
          ? result.error
          : "Buffer rejected this post.";

      return `${shortId}: ${error}`;
    });
}
