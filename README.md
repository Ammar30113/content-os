# Content OS

Content OS is an internal content operations workspace built with Next.js App
Router, TypeScript, Tailwind CSS, and ESLint.

The current foundation is intentionally local-first:

- No Supabase client is connected yet.
- No real secrets are committed.
- App pages use placeholder data until the data model is defined.

## Routes

- `/` - internal landing page
- `/app/dashboard` - workspace overview
- `/app/ideas` - idea backlog placeholder
- `/app/posts` - post index placeholder
- `/app/posts/[id]` - post detail placeholder
- `/app/calendar` - publishing calendar placeholder
- `/app/settings` - configuration placeholder

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file when needed:

```bash
cp .env.example .env.local
```

Leave the placeholder values empty until Supabase and OpenAI are ready to be
connected. When Supabase is configured later, `NEXT_PUBLIC_SUPABASE_URL` must
include the expected project ref:

```text
rxcxgnmnwonqzizjrgoh
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

Run linting:

```bash
npm run lint
```

Run a production build:

```bash
npm run build
```
