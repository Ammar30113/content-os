# ContentOS × OpenAI Codex Creative Production — Integration Plan

> **Strategy:** Codex-First Custom Plugin (Strategy A)
>
> ContentOS becomes a backend plugin inside the OpenAI Codex workspace.
> The Creative Production plugin (Figma, Canva, Fal, Shutterstock, Picsart)
> handles visual asset generation. ContentOS handles idea storage, post
> persistence, scheduling, and Buffer publishing.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   OpenAI Codex Workspace                    │
│                                                             │
│  ┌──────────────────────┐   ┌────────────────────────────┐  │
│  │  Creative Production │   │  ContentOS Custom Plugin   │  │
│  │  Plugin (built-in)   │   │  (OpenAPI / MCP)           │  │
│  │                      │   │                            │  │
│  │  • Canva             │   │  • GET  /api/codex/ideas   │  │
│  │  • Figma             │   │  • POST /api/codex/posts   │  │
│  │  • Fal.ai            │   │  • POST /api/codex/posts/  │  │
│  │  • Shutterstock      │   │        {id}/schedule       │  │
│  │  • Picsart           │   │  • GET  /api/codex/posts   │  │
│  └──────────┬───────────┘   └─────────────┬──────────────┘  │
│             │                             │                 │
│             └──────────┬──────────────────┘                 │
│                        │                                    │
│              Codex Agent orchestrates                       │
│              brief → design → save → schedule               │
└────────────────────────┼────────────────────────────────────┘
                         │
                         ▼
          ┌──────────────────────────────┐
          │   ContentOS (Next.js App)    │
          │   Vercel / localhost:3000    │
          │                              │
          │   Supabase DB & Storage      │
          │   Buffer Publishing Queue    │
          └──────────────────────────────┘
```

---

## Phase 1: ContentOS API Layer for Codex

### 1.1 New API Routes

Create a dedicated route group under `src/app/api/codex/` secured by a
shared service token (`CODEX_SERVICE_ROLE_KEY`).

| Method | Route                            | Purpose                                      |
| ------ | -------------------------------- | -------------------------------------------- |
| GET    | `/api/codex/ideas`               | List pending content ideas (no post yet)      |
| GET    | `/api/codex/ideas/[id]`          | Get a single idea with full brief + signal    |
| POST   | `/api/codex/posts`               | Create a new generated post from Codex output |
| GET    | `/api/codex/posts`               | List recent generated posts                   |
| GET    | `/api/codex/posts/[id]`          | Get a single post with image + template data  |
| PATCH  | `/api/codex/posts/[id]`          | Update post copy or image URL                 |
| POST   | `/api/codex/posts/[id]/approve`  | Mark a post as approved                       |
| POST   | `/api/codex/posts/[id]/schedule` | Schedule + send to Buffer                     |

### 1.2 Authentication Middleware

```typescript
// src/lib/codex-auth.ts
export function requireCodexAuth(request: Request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token || token !== process.env.CODEX_SERVICE_ROLE_KEY) {
    throw new Error("Unauthorized Codex request");
  }
}
```

Add `CODEX_SERVICE_ROLE_KEY` to `.env.example` and `.env.local`.

### 1.3 Request / Response Schemas

All endpoints use JSON. POST and PATCH bodies follow the existing
`generatedContentSchema` from `src/lib/content/types.ts` with these
Codex-specific additions:

```typescript
// POST /api/codex/posts body
{
  idea_id?: string;              // Link to existing idea, or create inline
  title: string;
  brief?: string;
  hook: string;
  headline: string;
  subhead: string;
  caption: string;
  hashtags: string[];
  cta: string;
  x_version: string;
  linkedin_version: string;
  image_url?: string;            // External URL from Codex creative tools
  image_prompt?: string;
  template_type: string;
  template_fields: object;
  scheduled_for?: string;        // ISO 8601 datetime
}
```

---

## Phase 2: OpenAPI Specification

### 2.1 Serve the Spec

Create `src/app/api/codex/openapi.json/route.ts` that returns a static
OpenAPI 3.1 spec describing all Codex endpoints.

Alternatively, commit a static `public/codex-openapi.json` file.

### 2.2 Key Spec Details

- `info.title`: "Content OS — Codex Plugin API"
- `servers`: `[{ url: "https://your-vercel-domain.vercel.app" }]`
- `security`: Bearer token in `Authorization` header
- Each route documented with request body schema, response schema,
  and example payloads

---

## Phase 3: Codex Plugin Manifest

### 3.1 Plugin Directory

```
.codex-plugin/
├── plugin.json
└── README.md
```

### 3.2 plugin.json

```json
{
  "schema_version": "v1",
  "name_for_model": "content_os",
  "name_for_human": "Content OS",
  "description_for_model": "Retrieve content briefs and local signal data for Rallio Instagram posts. Save generated post packages (copy, hashtags, CTA, image URL, template fields). Approve and schedule posts to Buffer for Instagram publishing. Use this plugin alongside the Creative Production plugin to turn briefs into visual assets before saving.",
  "description_for_human": "Manage Rallio content ideas, posts, and Instagram scheduling via Buffer.",
  "auth": {
    "type": "service_http",
    "authorization_type": "bearer",
    "verification_tokens": {}
  },
  "api": {
    "type": "openapi",
    "url": "https://your-vercel-domain.vercel.app/codex-openapi.json"
  }
}
```

---

## Phase 4: Image Asset Handoff

### 4.1 Problem

Codex Creative Production generates images hosted externally (Canva CDN,
Fal output URLs, etc.). ContentOS needs images in Supabase Storage for
Buffer publishing and the public image proxy.

### 4.2 Solution — Image Ingest Endpoint

Add `POST /api/codex/posts/[id]/ingest-image`:

1. Accept `{ image_url: string }` — the external URL from Codex.
2. Fetch the image server-side.
3. Convert to Instagram-safe JPEG using the existing `convertImageToInstagramJpeg()` in `src/lib/images/render.tsx`.
4. Upload to Supabase Storage under `{user_id}/{post_id}/`.
5. Update `generated_posts.image_url` and `media_assets`.

This reuses the Sharp pipeline already in ContentOS and ensures all images
go through the same quality/format gate.

---

## Phase 5: Workflow Examples

### 5.1 Single Post Generation

```
User (in Codex):
  "Pull the latest unposted idea from Content OS."

Codex → GET /api/codex/ideas?status=pending&limit=1
Codex receives:
  { id: "abc", title: "Ossington coffee signal", brief: "..." }

User:
  "Generate three Instagram visual options using the Creative Production
   plugin. Use the Rallio dark brand palette. 1080×1080."

Codex → Creative Production → Fal / Canva → 3 image URLs

User:
  "I like option 2. Save this post to Content OS with the approved image
   and schedule it for next Tuesday at 3pm ET."

Codex → POST /api/codex/posts { idea_id: "abc", image_url: "...", ... }
Codex → POST /api/codex/posts/{id}/ingest-image { image_url: "..." }
Codex → POST /api/codex/posts/{id}/schedule { scheduled_for: "..." }
```

### 5.2 Batch Campaign

```
User:
  "Fetch all ideas tagged for the Ossington launch batch."

Codex → GET /api/codex/ideas?batch=ossington_launch

User:
  "For each idea, generate a post package using the Creative Production
   plugin. Use the local signal data in each brief. Save all posts to
   Content OS and stagger scheduling across next week."

Codex loops:
  For each idea:
    1. Creative Production → generate visual
    2. POST /api/codex/posts → save copy + template fields
    3. POST /api/codex/posts/{id}/ingest-image → store image
    4. POST /api/codex/posts/{id}/schedule → queue to Buffer
```

---

## Phase 6: Environment & Config Changes

### 6.1 New Environment Variables

| Variable               | Purpose                              |
| ---------------------- | ------------------------------------ |
| `CODEX_SERVICE_ROLE_KEY` | Shared secret for Codex → ContentOS |

### 6.2 Updated .env.example

Add `CODEX_SERVICE_ROLE_KEY=` to `.env.example`.

### 6.3 Vercel Configuration

- Add `CODEX_SERVICE_ROLE_KEY` to Vercel environment variables.
- Ensure the Codex plugin manifest URL points to the production Vercel
  domain.

---

## Phase 7: Security Considerations

1. **Token-Based Auth:** All Codex endpoints are gated by
   `CODEX_SERVICE_ROLE_KEY`. No Supabase user session is required for
   these service-to-service calls.
2. **Write Safety:** All endpoints call `assertContentOsSupabaseWriteSafety()`
   to prevent writes to the wrong Supabase project.
3. **Rate Limiting:** Consider adding rate limiting middleware to prevent
   abuse of the image ingest endpoint.
4. **Image Validation:** The ingest endpoint should validate content-type
   and file size before downloading external images.
5. **CORS:** Codex endpoints do not need browser CORS headers — they are
   server-to-server.

---

## Implementation Order

- [ ] **Step 1:** Create `src/lib/codex-auth.ts` auth middleware
- [ ] **Step 2:** Create `src/app/api/codex/ideas/route.ts` (GET)
- [ ] **Step 3:** Create `src/app/api/codex/ideas/[id]/route.ts` (GET)
- [ ] **Step 4:** Create `src/app/api/codex/posts/route.ts` (GET, POST)
- [ ] **Step 5:** Create `src/app/api/codex/posts/[id]/route.ts` (GET, PATCH)
- [ ] **Step 6:** Create `src/app/api/codex/posts/[id]/approve/route.ts` (POST)
- [ ] **Step 7:** Create `src/app/api/codex/posts/[id]/schedule/route.ts` (POST)
- [ ] **Step 8:** Create `src/app/api/codex/posts/[id]/ingest-image/route.ts` (POST)
- [ ] **Step 9:** Create `public/codex-openapi.json` OpenAPI spec
- [ ] **Step 10:** Create `.codex-plugin/plugin.json` manifest
- [ ] **Step 11:** Add `CODEX_SERVICE_ROLE_KEY` to `.env.example` and Vercel
- [ ] **Step 12:** Test end-to-end with Codex workspace
- [ ] **Step 13:** Document workflow examples in README

---

## Success Criteria

1. A user in the Codex workspace can say "fetch my pending ideas from
   Content OS" and receive structured JSON briefs.
2. The Creative Production plugin can generate visuals from those briefs.
3. The user can save the final post package back to ContentOS and see it
   appear in the posts grid at `/app/posts`.
4. The user can schedule and send the post to Buffer from within Codex.
5. Images from external creative tools are automatically ingested,
   converted to Instagram-safe JPEGs, and stored in Supabase.
