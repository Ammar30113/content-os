# Content OS

Content OS is a private AI-powered social media operating system for Rallio and
Signal. It turns rough ideas, source-bank signals, URLs, or briefs into complete
Instagram post packages with branded 1080x1080 JPEGs, then supports review,
approval, ordered carousel rendering, scheduling, and brand-specific Buffer
handoff.

This is an internal single-user tool first. It intentionally does not include
billing, teams, public SaaS marketing flows, or direct Instagram/X/LinkedIn
publishing APIs.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, Storage, and RLS
- OpenAI structured outputs
- `@vercel/og` image rendering

## Required Supabase Project

Use only the Content OS Supabase project:

```text
https://rxcxgnmnwonqzizjrgoh.supabase.co
```

Backend writes are blocked unless `NEXT_PUBLIC_SUPABASE_URL` exactly matches:

```text
https://rxcxgnmnwonqzizjrgoh.supabase.co
```

Never use any unrelated Supabase project for this app.

## Environment

Create a local env file:

```bash
cp .env.example .env.local
```

Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=
BUFFER_ACCESS_TOKEN=
BUFFER_ORGANIZATION_ID=
BUFFER_RALLIO_INSTAGRAM_CHANNEL_ID=
BUFFER_SIGNAL_INSTAGRAM_CHANNEL_ID=
BUFFER_CHANNEL_QUEUE_CAP=
```

Do not commit `.env.local` or real secrets.

`OPENAI_MODEL` defaults to `gpt-4o-mini` if omitted. Use a model your OpenAI
project has access to and that supports structured outputs on the Responses API.

Rallio generation defaults to the internal community/taste-map topic bank for
Instagram feed growth. When an idea includes a `source_url`, generation fetches
and summarizes that page for topical context (see `src/lib/content/source.ts`).

> Note: live web research via Tavily is planned but not yet implemented. There is
> no `TAVILY_API_KEY` wiring in the codebase today.

## Supabase Setup

Apply migrations to the Content OS project:

```bash
supabase login
supabase link --project-ref rxcxgnmnwonqzizjrgoh
supabase db push
```

The migration creates:

- `content_ideas`
- `generated_posts`
- `media_assets`
- `post_analytics`
- `publishing_jobs`
- `social_accounts`
- RLS policies for user-owned rows
- `post-images` storage bucket and folder policies

For the fastest internal MVP login, create your first user in Supabase:

1. Open Supabase Dashboard → Authentication → Users.
2. Add your own email/password user and mark the user as confirmed, or turn off email confirmation under Authentication → Sign In / Providers → Email.
3. Add these allowed redirect URLs under Authentication → URL Configuration:

```text
http://localhost:3000/auth/callback
https://your-vercel-domain.vercel.app/auth/callback
```

Supabase's built-in email provider has a low project-wide email-send limit. If
you see `email rate limit exceeded`, wait for the limit to reset, create/confirm
the user from the dashboard, or configure custom SMTP before repeated signup
testing.

## Routes

- `/` - internal positioning page
- `/auth` - email/password sign in and sign up
- `/app/dashboard` - metrics and recent posts
- `/app/ideas` - save ideas and generate packages
- `/app/ideas` also switches between the isolated Rallio and Signal generators
- `/app/posts` - review grid with approve/schedule/regenerate actions
- `/app/posts/[id]` - editor, image upload/regeneration, scheduling
- `/app/calendar` - scheduled and published posts
- `/app/settings` - project safety and connection health

## Buffer Publishing

Content OS can hand scheduled posts to Buffer after review:

1. Generate and approve a post.
2. Set `Scheduled for` in the editor.
3. Click `Save, schedule, send to Buffer`.
4. Confirm the single image or ordered carousel appears in Buffer's queue.
5. After Instagram confirms the post went live, mark it published in Content OS.

Generated template images and carousel slides are stored as JPEGs for
Instagram/Buffer compatibility. Older PNG images are served through the public
proxy as JPEGs when Buffer fetches them. Buffer uses the ordered `assets` array
shape required by the current public API.

The production Vercel cron at `/api/cron/publish-due-posts` also sweeps queued
publishing jobs inside the next 14 days once per day. Vercel Hobby plans do not
support high-frequency cron, so the editor button is the primary no-wait handoff.
The same cron deletes Buffer-sent scheduled post records after the 10-day
scheduled tab retention window once the Buffer slot has passed, including
generated image storage cleanup.

`CRON_SECRET` is mandatory. The cron route fails closed when the secret is
missing and accepts only the matching Bearer token.

Buffer environment variables:

```bash
BUFFER_ACCESS_TOKEN=
BUFFER_ORGANIZATION_ID=
BUFFER_RALLIO_INSTAGRAM_CHANNEL_ID=
BUFFER_SIGNAL_INSTAGRAM_CHANNEL_ID=
BUFFER_CHANNEL_QUEUE_CAP=
```

`BUFFER_RALLIO_INSTAGRAM_CHANNEL_ID` and
`BUFFER_SIGNAL_INSTAGRAM_CHANNEL_ID` are brand-specific Instagram queues. Rallio
and Signal posts are Instagram-only, and Content OS does not fall back across
brand channels.
Leave `BUFFER_CHANNEL_QUEUE_CAP` unset for paid-plan scheduling. Set it only if
you want Content OS to enforce a local queue ceiling before handing posts to
Buffer.

## Local Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run lint
npm run typecheck
npm run test:logic
npm run build
git diff --check
```

Run `npm run verify` for lint, type checking, logic tests, rotation checks, and
the production build in one command. Before applying a new linked Supabase
migration, also run `supabase db push --dry-run`.
