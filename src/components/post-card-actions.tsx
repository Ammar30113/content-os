"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Check, RefreshCw, Trash2 } from "lucide-react";

import { getCarouselMediaIssue } from "@/lib/content/carousel-media";
import type { Json } from "@/types/database";

type PostCardActionsProps = {
  postId: string;
  postType: string;
  templateType: string | null;
  templateFields: Json;
  videoUrl?: string | null;
};

export function PostCardActions({
  postId,
  postType,
  templateType,
  templateFields,
  videoUrl,
}: PostCardActionsProps) {
  const [scheduledFor, setScheduledFor] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isCarousel = postType === "carousel";
  const carouselMediaIssue = getCarouselMediaIssue(postType, templateFields);
  const canRegenerateImage = postType !== "reel" && Boolean(templateType);
  const canSchedule =
    (postType !== "reel" || Boolean(videoUrl)) && !carouselMediaIssue;

  async function runAction(action: string, request: () => Promise<Response>) {
    setLoadingAction(action);
    setError(null);

    try {
      const response = await request();
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || `${action} failed.`);
      }

      router.refresh();
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : `${action} failed.`,
      );
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="space-y-3 border-t border-zinc-800 pt-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(loadingAction)}
          onClick={() =>
            runAction("Approve", () =>
              fetch(`/api/posts/${postId}/approve`, { method: "POST" }),
            )
          }
          className="inline-flex h-9 items-center gap-2 rounded border border-zinc-700 px-3 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-50"
        >
          <Check size={15} />
          {loadingAction === "Approve" ? "Approving..." : "Approve"}
        </button>
        {canRegenerateImage ? (
          <button
            type="button"
            disabled={Boolean(loadingAction)}
            onClick={() =>
              runAction(
                isCarousel ? "Render carousel slides" : "Regenerate image",
                () =>
                  fetch(
                    isCarousel ? "/api/render-carousel" : "/api/render-template",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(
                        isCarousel
                          ? {
                              post_id: postId,
                              template_fields: templateFields,
                            }
                          : {
                              post_id: postId,
                              template_type: templateType,
                              template_fields: templateFields,
                            },
                      ),
                    },
                  ),
              )
            }
            className="inline-flex h-9 items-center gap-2 rounded border border-zinc-700 px-3 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-50"
          >
            <RefreshCw size={15} />
            {loadingAction === "Regenerate image" ||
            loadingAction === "Render carousel slides"
              ? "Rendering..."
              : isCarousel
                ? "Render slides"
                : "Regenerate"}
          </button>
        ) : null}
        <button
          type="button"
          disabled={Boolean(loadingAction)}
          onClick={() => {
            if (
              !window.confirm(
                "Delete this post? This removes related schedule jobs and generated image records.",
              )
            ) {
              return;
            }

            runAction("Delete", () =>
              fetch(`/api/posts/${postId}`, { method: "DELETE" }),
            );
          }}
          className="inline-flex h-9 items-center gap-2 rounded border border-red-500/40 px-3 text-xs font-semibold text-red-200 transition hover:bg-red-500/10 disabled:opacity-50"
        >
          <Trash2 size={15} />
          {loadingAction === "Delete" ? "Deleting..." : "Delete"}
        </button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="datetime-local"
          value={scheduledFor}
          onChange={(event) => setScheduledFor(event.target.value)}
          className="h-9 rounded border border-zinc-700 bg-[#0a0a0b] px-3 text-xs text-white outline-none focus:border-[#d4ff00]"
        />
        <button
          type="button"
          disabled={Boolean(loadingAction) || !scheduledFor || !canSchedule}
          onClick={() =>
            runAction("Schedule", () =>
              fetch("/api/schedule-post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  post_id: postId,
                  scheduled_for: new Date(scheduledFor).toISOString(),
                }),
              }),
            )
          }
          className="inline-flex h-9 items-center justify-center gap-2 rounded bg-[#d4ff00] px-3 text-xs font-semibold text-[#0a0a0b] transition hover:bg-[#e7ff68] disabled:opacity-50"
        >
          <CalendarPlus size={15} />
          {loadingAction === "Schedule" ? "Scheduling..." : "Schedule"}
        </button>
      </div>
      {carouselMediaIssue ? (
        <p className="text-xs leading-5 text-amber-200">
          Render the full carousel before scheduling or sending it to Buffer.
        </p>
      ) : !canSchedule ? (
        <p className="text-xs leading-5 text-zinc-500">
          Attach the finished Reel video before scheduling.
        </p>
      ) : null}
      {error ? <p className="text-xs leading-5 text-red-300">{error}</p> : null}
    </div>
  );
}
