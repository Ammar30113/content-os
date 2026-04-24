"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, Save, Sparkles } from "lucide-react";

import { platforms, postTypes, templateHints, tones } from "@/lib/content/types";

const defaultForm = {
  title: "",
  brief: "",
  source_url: "",
  platform: "instagram",
  post_type: "single",
  tone: "educational",
  template_hint: "auto",
};

type ActionState = {
  loading: boolean;
  message: string | null;
  error: string | null;
};

export function IdeaGeneratorForm() {
  const [form, setForm] = useState(defaultForm);
  const [state, setState] = useState<ActionState>({
    loading: false,
    message: null,
    error: null,
  });
  const router = useRouter();

  function updateField(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function saveIdea() {
    setState({ loading: true, message: "Saving idea...", error: null });

    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not save idea.");
      }

      setState({ loading: false, message: "Idea saved.", error: null });
      router.refresh();
    } catch (error) {
      setState({
        loading: false,
        message: null,
        error: error instanceof Error ? error.message : "Could not save idea.",
      });
    }
  }

  async function generatePackage() {
    setState({
      loading: true,
      message: "Generating structured content package...",
      error: null,
    });

    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Could not generate content.");
      }

      setState({
        loading: true,
        message: "Rendering branded template image...",
        error: null,
      });

      const renderResponse = await fetch("/api/render-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: payload.post.id,
          template_type: payload.content.template_type,
          template_fields: payload.content.template_fields,
        }),
      });
      const renderPayload = await renderResponse.json();

      if (!renderResponse.ok) {
        setState({
          loading: false,
          message:
            "Content generated. Image render failed, but the post is editable.",
          error: renderPayload.error || "Image render failed.",
        });
        router.push(`/app/posts/${payload.post.id}`);
        return;
      }

      setState({
        loading: false,
        message: "Content package and branded image ready.",
        error: null,
      });
      router.push(`/app/posts/${payload.post.id}`);
      router.refresh();
    } catch (error) {
      setState({
        loading: false,
        message: null,
        error:
          error instanceof Error
            ? error.message
            : "Could not generate content package.",
      });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await generatePackage();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded border border-zinc-800 bg-zinc-950 p-5"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded bg-[#d4ff00] text-[#0a0a0b]">
          <FilePlus2 size={18} />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-white">New content idea</h2>
          <p className="text-sm text-zinc-500">
            Brief it once, generate the package, render the image.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <label className="block">
          <span className="text-sm font-medium text-zinc-300">Title</span>
          <input
            required
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            className="mt-2 h-11 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 text-sm text-white outline-none focus:border-[#d4ff00]"
            placeholder="AI agents are quietly changing local search"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-300">Brief</span>
          <textarea
            required
            value={form.brief}
            onChange={(event) => updateField("brief", event.target.value)}
            className="mt-2 min-h-32 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 py-3 text-sm leading-6 text-white outline-none focus:border-[#d4ff00]"
            placeholder="What should this post teach, react to, or make people save?"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-300">
            Source URL optional
          </span>
          <input
            type="url"
            value={form.source_url}
            onChange={(event) => updateField("source_url", event.target.value)}
            className="mt-2 h-11 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 text-sm text-white outline-none focus:border-[#d4ff00]"
            placeholder="https://..."
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label="Platform"
            value={form.platform}
            options={platforms}
            onChange={(value) => updateField("platform", value)}
          />
          <SelectField
            label="Post type"
            value={form.post_type}
            options={postTypes}
            onChange={(value) => updateField("post_type", value)}
          />
          <SelectField
            label="Tone"
            value={form.tone}
            options={tones}
            onChange={(value) => updateField("tone", value)}
          />
          <SelectField
            label="Template"
            value={form.template_hint}
            options={templateHints}
            onChange={(value) => updateField("template_hint", value)}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={saveIdea}
          disabled={state.loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded border border-zinc-700 px-4 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:opacity-50"
        >
          <Save size={17} />
          Save idea
        </button>
        <button
          type="submit"
          disabled={state.loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded bg-[#d4ff00] px-4 text-sm font-semibold text-[#0a0a0b] transition hover:bg-[#e7ff68] disabled:opacity-50"
        >
          <Sparkles size={17} />
          {state.loading ? "Working..." : "Generate content package"}
        </button>
      </div>

      {state.message ? (
        <p className="mt-4 rounded border border-[#d4ff00]/30 bg-[#d4ff00]/10 p-3 text-sm text-[#ecff8a]">
          {state.message}
        </p>
      ) : null}
      {state.error ? (
        <p className="mt-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded border border-zinc-700 bg-[#0a0a0b] px-3 text-sm text-white outline-none focus:border-[#d4ff00]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
