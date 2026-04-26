# Content OS

Content OS is a private AI-powered social media operating system for the Word
of AI brand (`@wordofaii`). The MVP turns rough ideas, URLs, or briefs into
complete social post packages with branded 1080x1080 images, then supports
review, approval, scheduling, and manual publish tracking.

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

Backend writes are blocked unless `NEXT_PUBLIC_SUPABASE_URL` includes:

```text
rxcxgnmnwonqzizjrgoh
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
```

Do not commit `.env.local` or real secrets.

`OPENAI_MODEL` defaults to `gpt-4o-mini` if omitted. Use a model your OpenAI
project has access to and that supports structured outputs on the Responses API.

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
- `/app/posts` - review grid with approve/schedule/regenerate actions
- `/app/posts/[id]` - editor, image upload/regeneration, scheduling
- `/app/calendar` - scheduled and published posts
- `/app/settings` - project safety and connection health

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
npm run build
```
