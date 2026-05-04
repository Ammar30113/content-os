"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  Check,
  Clipboard,
  Clock,
  ImageUp,
  RefreshCw,
  Save,
  Send,
  Trash2,
} from "lucide-react";

import {
  normalizeHashtags,
  parseJsonField,
  platforms,
  postStatuses,
  templateTypes,
} from "@/lib/content/types";
import type { Database, Json } from "@/types/database";

const MANUAL_SLOT_WINDOW_DAYS = 7;

type GeneratedPost = Database["public"]["Tables"]["generated_posts"]["Row"];

type FormState = {
  hook: string;
  headline: string;
  subhead: string;
  caption: string;
  hashtags: string;
  cta: string;
  carousel_slides: string;
  reel_script: string;
  x_version: string;
  linkedin_version: string;
  template_type: string;
  template_fields: string;
  image_url: string;
  status: string;
  scheduled_for: string;
};

type ActionState = {
  loading: string | null;
  message: string | null;
  error: string | null;
};

export function PostEditorForm({ post }: { post: GeneratedPost }) {
  const initialState = useMemo<FormState>(
    () => ({
      hook: post.hook || "",
      headline: post.headline || "",
      subhead: post.subhead || "",
      caption: post.caption || "",
      hashtags: (post.hashtags || []).join(" "),
      cta: post.cta || "",
      carousel_slides: JSON.stringify(post.carousel_slides || [], null, 2),
      reel_script: post.reel_script || "",
      x_version: post.x_version || "",
      linkedin_version: post.linkedin_version || "",
      template_type: post.template_type || "news_digest",
      template_fields: JSON.stringify(post.template_fields || {}, null, 2),
      image_url: post.image_url || "",
      status: post.status,
      scheduled_for: toDateTimeLocal(post.scheduled_for),
    }),
    [post],
  );
  const [form, setForm] = useState(initialState);
  const [state, setState] = useState<ActionState>({
    loading: null,
    message: null,
    error: null,
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const router = useRouter();
  const parsedTemplateFields = useMemo(
    () => parseJsonField<Record<string, unknown>>(form.template_fields, {}),
    [form.template_fields],
  );
  const selectedChannels = useMemo(() => {
    const stored = parsedTemplateFields.selected_platforms;

    if (Array.isArray(stored)) {
      const validChannels = stored.filter(
        (item): item is (typeof platforms)[number] =>
          typeof item === "string" &&
          platforms.includes(item as (typeof platforms)[number]),
      );

      if (validChannels.length) {
        return validChannels;
      }
    }

    return [post.platform];
  }, [parsedTemplateFields, post.platform]);
  const hashtagsText = normalizeHashtags(form.hashtags).join(" ");
  const instagramPackage = [form.caption.trim(), hashtagsText]
    .filter(Boolean)
    .join("\n\n");
  const workflowReadiness = getWorkflowReadiness({
    status: form.status,
    hasImage: Boolean(form.image_url),
    hasCopy: Boolean(form.caption || form.x_version || form.linkedin_version),
    scheduledFor: form.scheduled_for,
  });
  const bufferPosts = getBufferPosts(parsedTemplateFields);

  function updateField(name: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function buildPayload() {
    let carouselSlides: Json;
    let templateFields: Json;

    try {
      carouselSlides = JSON.parse(form.carousel_slides) as Json;
    } catch {
      throw new Error("Carousel slides must be valid JSON.");
    }

    try {
      templateFields = JSON.parse(form.template_fields) as Json;
    } catch {
      throw new Error("Template fields must be valid JSON.");
    }

    return {
      hook: form.hook || null,
      headline: form.headline || null,
      subhead: form.subhead || null,
      caption: form.caption || null,
      hashtags: normalizeHashtags(form.hashtags),
      cta: form.cta || null,
      carousel_slides: carouselSlides,
      reel_script: form.reel_script || null,
      x_version: form.x_version || null,
      linkedin_version: form.linkedin_version || null,
      template_type: form.template_type,
      template_fields: templateFields,
      image_url: form.image_url || null,
      status: form.status,
      scheduled_for: form.scheduled_for
        ? new Date(form.scheduled_for).toISOString()
        : null,
    };
  }

  async function runAction(
    loading: string,
    request: () => Promise<Response>,
    successMessage: string,
  ) {
    setState({ loading, message: null, error: null });

    try {
      const response = await request();
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || `${loading} failed.`);
      }

      setState({ loading: null, message: successMessage, error: null });
      router.refresh();
    } catch (error) {
      setState({
        loading: null,
        message: null,
        error: error instanceof Error ? error.message : `${loading} failed.`,
      });
    }
  }

  async function copyToClipboard(value: string, label: string) {
    if (!value.trim()) {
      setState({ loading: null, message: null, error: `${label} is empty.` });
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setState({ loading: null, message: `${label} copied.`, error: null });
    } catch {
      setState({
        loading: null,
        message: null,
        error: `Could not copy ${label.toLowerCase()}.`,
      });
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(
      "Saving",
      () =>
        fetch(`/api/posts/${post.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        }),
      "Post saved.",
    );
  }

  async function handleRegenerateImage() {
    const payload = buildPayload();
    await runAction(
      "Rendering",
      () =>
        fetch("/api/render-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            post_id: post.id,
            template_type: payload.template_type,
            template_fields: payload.template_fields,
          }),
        }),
      "Image regenerated.",
    );
  }

  async function handleUploadImage() {
    if (!uploadFile) {
      setState({ loading: null, message: null, error: "Choose an image first." });
      return;
    }

    const uploadData = new FormData();
    uploadData.append("image", uploadFile);

    await runAction(
      "Uploading",
      () =>
        fetch(`/api/posts/${post.id}/upload-image`, {
          method: "POST",
          body: uploadData,
        }),
      "Image uploaded.",
    );
  }

  async function handleSchedule() {
    if (!form.scheduled_for) {
      setState({
        loading: null,
        message: null,
        error: "Choose a scheduled date and time.",
      });
      return;
    }

    await runAction(
      "Scheduling",
      () =>
        fetch("/api/schedule-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            post_id: post.id,
            scheduled_for: new Date(form.scheduled_for).toISOString(),
          }),
        }),
      "Post scheduled.",
    );
  }

  async function handleSendToBuffer() {
    setState({ loading: "Sending to Buffer", message: null, error: null });

    try {
      const saveResponse = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const savePayload = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(savePayload.error || "Could not save post before Buffer send.");
      }

      const bufferResponse = await fetch("/api/send-to-buffer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: post.id,
          scheduled_for: form.scheduled_for
            ? new Date(form.scheduled_for).toISOString()
            : undefined,
        }),
      });
      const bufferPayload = await bufferResponse.json();

      if (!bufferResponse.ok) {
        throw new Error(bufferPayload.error || "Could not send post to Buffer.");
      }

      setState({
        loading: null,
        message:
          bufferPayload.message ||
          "Saved, sent to Buffer, and marked complete in Content OS.",
        error: null,
      });
      router.refresh();
    } catch (error) {
      setState({
        loading: null,
        message: null,
        error: error instanceof Error ? error.message : "Could not send post to Buffer.",
      });
    }
  }

  async function handleDeletePost() {
    if (
      !window.confirm(
        "Delete this post? This removes related schedule jobs and generated image records.",
      )
    ) {
      return;
    }

    setState({ loading: "Deleting", message: null, error: null });

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not delete post.");
      }

      router.push("/app/posts");
      router.refresh();
    } catch (error) {
      setState({
        loading: null,
        message: null,
        error: error instanceof Error ? error.message : "Could not delete post.",
      });
    }
  }

  function applyNextSlot() {
    const nextSlot = getNextManualSlot(post.platform);
    updateField("scheduled_for", formatDateTimeLocal(nextSlot));
    setState({
      loading: null,
      message: "Next manual publishing slot applied.",
      error: null,
    });
  }

  return (
    <form onSubmit={handleSave} className="grid gap-6 xl:grid-cols-[1fr_390px]">
      <section className="space-y-5">
        <Panel title="Core copy">
          <InputField label="Hook" value={form.hook} onChange={(value) => updateField("hook", value)} />
          <InputField
            label="Headline"
            value={form.headline}
            onChange={(value) => updateField("headline", value)}
          />
          <InputField
            label="Subhead"
            value={form.subhead}
            onChange={(value) => updateField("subhead", value)}
          />
          <TextareaField
            label="Caption"
            value={form.caption}
            rows={8}
            onChange={(value) => updateField("caption", value)}
          />
          <InputField
            label="Hashtags"
            value={form.hashtags}
            onChange={(value) => updateField("hashtags", value)}
          />
          <InputField label="CTA" value={form.cta} onChange={(value) => updateField("cta", value)} />
        </Panel>

        <Panel title="Platform variants">
          <TextareaField
            label="Carousel slides JSON"
            value={form.carousel_slides}
            rows={9}
            monospace
            onChange={(value) => updateField("carousel_slides", value)}
          />
          <TextareaField
            label="Reel script"
            value={form.reel_script}
            rows={7}
            onChange={(value) => updateField("reel_script", value)}
          />
          <TextareaField
            label="X version"
            value={form.x_version}
            rows={5}
            onChange={(value) => updateField("x_version", value)}
          />
          <TextareaField
            label="LinkedIn version"
            value={form.linkedin_version}
            rows={6}
            onChange={(value) => updateField("linkedin_version", value)}
          />
        </Panel>

        <Panel title="Template fields">
          <p className="text-sm leading-6 text-zinc-500">
            Visual fields can include <code>hero_image_url</code>,{" "}
            <code>source_logo_url</code>, <code>product_logo</code>,{" "}
            <code>visual_subject</code>, <code>swipe_hint</code>, and{" "}
            <code>bottom_label</code>. Meme templates can also use{" "}
            <code>meme_setup</code> and <code>meme_punchline</code>. Authority
            POV posts can use <code>authority_figure</code>,{" "}
            <code>topical_event</code>, <code>contrarian_take</code>,{" "}
            <code>builder_lesson</code>, <code>text_overlay_hook</code>, and{" "}
            <code>review_notes</code>. Leave URL fields blank unless you have a
            real image URL.
          </p>
          <label className="block">
            <span className="text-sm font-medium text-zinc-300">Template type</span>
            <select
              value={form.template_type}
              onChange={(event) => updateField("template_type", event.target.value)}
              className="mt-2 h-11 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 text-sm text-white outline-none focus:border-[#d4ff00]"
            >
              {templateTypes.map((template) => (
                <option key={template} value={template}>
                  {template.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <TextareaField
            label="Template fields JSON"
            value={form.template_fields}
            rows={14}
            monospace
            onChange={(value) => updateField("template_fields", value)}
          />
        </Panel>
      </section>

      <aside className="space-y-5">
        <Panel title="Image preview">
          <div className="aspect-square overflow-hidden rounded border border-zinc-800 bg-black">
            {form.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.image_url}
                alt={form.headline || "Generated post image"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center px-6 text-center text-sm leading-6 text-zinc-500">
                No image yet. Regenerate from template fields or upload one.
              </div>
            )}
          </div>
          <InputField
            label="Image URL"
            value={form.image_url}
            onChange={(value) => updateField("image_url", value)}
          />
          <div className="rounded border border-zinc-800 bg-[#0a0a0b] p-3 text-sm">
            <p className="text-zinc-400">
              Image status:{" "}
              <span className="font-semibold text-white">{post.image_status}</span>
            </p>
            {post.image_error ? (
              <p className="mt-2 text-red-300">{post.image_error}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleRegenerateImage}
            disabled={Boolean(state.loading)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded border border-zinc-700 px-3 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            {state.loading === "Rendering" ? "Rendering..." : "Regenerate image"}
          </button>
          <label className="block">
            <span className="text-sm font-medium text-zinc-300">
              Upload own image
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setUploadFile(event.target.files?.[0] || null)
              }
              className="mt-2 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 py-2 text-sm text-zinc-300"
            />
          </label>
          <button
            type="button"
            onClick={handleUploadImage}
            disabled={Boolean(state.loading)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded border border-zinc-700 px-3 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:opacity-50"
          >
            <ImageUp size={16} />
            {state.loading === "Uploading" ? "Uploading..." : "Upload image"}
          </button>
        </Panel>

        <Panel title="Publish kit">
          <div className="rounded border border-zinc-800 bg-[#0a0a0b] p-3 text-sm">
            <p className="font-medium text-white">Prepared channels</p>
            <p className="mt-1 text-zinc-500">{selectedChannels.join(", ")}</p>
          </div>
          {bufferPosts.length ? (
            <div className="space-y-2 rounded border border-[#b8c28a]/30 bg-[#b8c28a]/10 p-3 text-sm">
              <p className="font-medium text-[#eef7c5]">Buffer handoff</p>
              {bufferPosts.map((entry) => (
                <p key={entry.platform} className="text-zinc-300">
                  {entry.platform}: {entry.status}
                </p>
              ))}
            </div>
          ) : null}
          <CopyButton
            label="Copy IG package"
            value={instagramPackage}
            onCopy={copyToClipboard}
          />
          <CopyButton
            label="Copy X version"
            value={form.x_version}
            onCopy={copyToClipboard}
          />
          <CopyButton
            label="Copy LinkedIn version"
            value={form.linkedin_version}
            onCopy={copyToClipboard}
          />
          <CopyButton
            label="Copy Reel script"
            value={form.reel_script}
            onCopy={copyToClipboard}
          />
          <CopyButton
            label="Copy hashtags"
            value={hashtagsText}
            onCopy={copyToClipboard}
          />
          <CopyButton
            label="Copy image URL"
            value={form.image_url}
            onCopy={copyToClipboard}
          />
        </Panel>

        <Panel title="Workflow">
          <div className="rounded border border-zinc-800 bg-[#0a0a0b] p-3 text-sm">
            <p className="font-medium text-white">{workflowReadiness.title}</p>
            <p className="mt-1 leading-5 text-zinc-500">
              {workflowReadiness.description}
            </p>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-zinc-300">Status</span>
            <select
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
              className="mt-2 h-11 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 text-sm text-white outline-none focus:border-[#d4ff00]"
            >
              {postStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-300">
              Scheduled for
            </span>
            <input
              type="datetime-local"
              value={form.scheduled_for}
              onChange={(event) => updateField("scheduled_for", event.target.value)}
              className="mt-2 h-11 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 text-sm text-white outline-none focus:border-[#d4ff00]"
            />
          </label>
          <button
            type="button"
            onClick={applyNextSlot}
            disabled={Boolean(state.loading)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded border border-zinc-700 px-3 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:opacity-50"
          >
            <Clock size={16} />
            Use next manual slot
          </button>
          <button
            type="submit"
            disabled={Boolean(state.loading)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-[#d4ff00] px-3 text-sm font-semibold text-[#0a0a0b] transition hover:bg-[#e7ff68] disabled:opacity-50"
          >
            <Save size={16} />
            {state.loading === "Saving" ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() =>
              runAction(
                "Approving",
                () => fetch(`/api/posts/${post.id}/approve`, { method: "POST" }),
                "Post approved.",
              )
            }
            disabled={Boolean(state.loading)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded border border-zinc-700 px-3 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:opacity-50"
          >
            <Check size={16} />
            {state.loading === "Approving" ? "Approving..." : "Approve"}
          </button>
          <button
            type="button"
            onClick={handleSchedule}
            disabled={Boolean(state.loading)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded border border-zinc-700 px-3 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:opacity-50"
          >
            <CalendarPlus size={16} />
            {state.loading === "Scheduling" ? "Scheduling..." : "Schedule"}
          </button>
          <button
            type="button"
            onClick={handleSendToBuffer}
            disabled={Boolean(state.loading)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-[#d4ff00] px-3 text-sm font-semibold text-[#0a0a0b] transition hover:bg-[#e7ff68] disabled:opacity-50"
          >
            <Send size={16} />
            {state.loading === "Sending to Buffer"
              ? "Sending..."
              : "Save and send to Buffer"}
          </button>
          <button
            type="button"
            onClick={() =>
              runAction(
                "Publishing",
                () =>
                  fetch("/api/mark-published", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ post_id: post.id }),
                  }),
                "Post marked as published.",
              )
            }
            disabled={Boolean(state.loading)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded border border-zinc-700 px-3 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:opacity-50"
          >
            <Send size={16} />
            {state.loading === "Publishing" ? "Publishing..." : "Mark published"}
          </button>
          <button
            type="button"
            onClick={handleDeletePost}
            disabled={Boolean(state.loading)}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded border border-red-500/40 px-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            <Trash2 size={16} />
            {state.loading === "Deleting" ? "Deleting..." : "Delete post"}
          </button>
        </Panel>

        {state.message ? (
          <p className="rounded border border-[#d4ff00]/30 bg-[#d4ff00]/10 p-3 text-sm text-[#ecff8a]">
            {state.message}
          </p>
        ) : null}
        {state.error ? (
          <p className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
            {state.error}
          </p>
        ) : null}
      </aside>
    </form>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 text-sm text-white outline-none focus:border-[#d4ff00]"
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  rows,
  monospace,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  monospace?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-2 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 py-3 text-sm leading-6 text-white outline-none focus:border-[#d4ff00] ${
          monospace ? "font-mono" : ""
        }`}
      />
    </label>
  );
}

function CopyButton({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (value: string, label: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCopy(value, label)}
      disabled={!value.trim()}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded border border-zinc-700 px-3 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Clipboard size={16} />
      {label}
    </button>
  );
}

function getWorkflowReadiness({
  status,
  hasImage,
  hasCopy,
  scheduledFor,
}: {
  status: string;
  hasImage: boolean;
  hasCopy: boolean;
  scheduledFor: string;
}) {
  if (status === "published") {
    return {
      title: "Buffer handoff complete",
      description:
        "This post has been sent to Buffer or marked complete in Content OS.",
    };
  }

  if (status === "scheduled" && scheduledFor) {
    return {
      title: "Ready for manual publishing",
      description:
        "Copy the publish kit when the scheduled slot arrives, then mark the post published.",
    };
  }

  if (status === "approved" && hasImage && hasCopy) {
    return {
      title: "Approved and ready to schedule",
      description:
        "Pick a manual publishing time or use the next suggested slot.",
    };
  }

  if (!hasImage) {
    return {
      title: "Needs image",
      description: "Regenerate the template image or upload your own image.",
    };
  }

  if (!hasCopy) {
    return {
      title: "Needs copy",
      description: "Add platform copy before approving or scheduling.",
    };
  }

  return {
    title: "Draft",
    description: "Review the copy and image, then approve the post.",
  };
}

function getBufferPosts(fields: Record<string, unknown>) {
  const bufferPosts = fields.buffer_posts;

  if (!bufferPosts || typeof bufferPosts !== "object" || Array.isArray(bufferPosts)) {
    return [];
  }

  return Object.entries(bufferPosts)
    .map(([platform, value]) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
      }

      const record = value as Record<string, unknown>;

      return {
        platform,
        status: typeof record.status === "string" ? record.status : "sent",
      };
    })
    .filter(
      (entry): entry is { platform: string; status: string } => entry !== null,
    );
}

function getNextManualSlot(platform: string) {
  const slots =
    platform === "x"
      ? [8, 11, 14, 17, 20]
      : platform === "linkedin"
        ? [9, 13, 16]
        : [8, 12, 17];
  const now = new Date();
  const minTime = new Date(now.getTime() + 30 * 60 * 1000);
  const maxTime = new Date(
    now.getTime() + MANUAL_SLOT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  for (let dayOffset = 0; dayOffset <= MANUAL_SLOT_WINDOW_DAYS; dayOffset += 1) {
    for (const hour of slots) {
      const candidate = new Date(now);
      candidate.setDate(now.getDate() + dayOffset);
      candidate.setHours(hour, 0, 0, 0);

      if (candidate >= minTime && candidate <= maxTime) {
        return candidate;
      }
    }
  }

  return minTime;
}

function toDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return formatDateTimeLocal(date);
}

function formatDateTimeLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
