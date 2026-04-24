create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.content_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  brief text,
  source_url text,
  source_summary text,
  status text not null default 'draft' check (status in ('draft', 'generated', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.generated_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_id uuid references public.content_ideas(id) on delete set null,
  platform text not null default 'instagram' check (platform in ('instagram', 'x', 'linkedin')),
  post_type text not null default 'single' check (post_type in ('single', 'carousel', 'reel', 'thread')),
  tone text not null default 'educational' check (tone in ('educational', 'viral', 'founder', 'contrarian', 'news', 'tutorial')),
  pillar text check (pillar is null or pillar in ('news_digest', 'tool_stack', 'tutorial', 'creator_economy', 'founder_story')),
  template_type text check (template_type is null or template_type in ('news_digest', 'tool_stack', 'tutorial', 'creator_economy', 'founder_story')),
  hook text,
  headline text,
  subhead text,
  caption text,
  hashtags text[] default '{}',
  cta text,
  carousel_slides jsonb default '[]'::jsonb,
  reel_script text,
  x_version text,
  linkedin_version text,
  image_prompt text,
  template_fields jsonb default '{}'::jsonb,
  image_url text,
  image_status text not null default 'not_generated' check (image_status in ('not_generated', 'generating', 'generated', 'failed')),
  image_error text,
  status text not null default 'draft' check (status in ('draft', 'reviewing', 'approved', 'scheduled', 'published', 'failed', 'archived')),
  scheduled_for timestamptz,
  published_at timestamptz,
  publish_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.generated_posts(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  source text not null check (source in ('template', 'upload', 'ai')),
  prompt text,
  created_at timestamptz not null default now()
);

create table public.post_analytics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.generated_posts(id) on delete cascade,
  platform text,
  impressions integer default 0,
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  saves integer default 0,
  clicks integer default 0,
  recorded_at timestamptz default now()
);

create table public.publishing_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.generated_posts(id) on delete cascade,
  platform text not null,
  status text not null default 'queued' check (status in ('queued', 'ready', 'published', 'failed', 'cancelled')),
  scheduled_for timestamptz not null,
  attempts integer not null default 0,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  account_name text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_ideas_user_created_idx on public.content_ideas (user_id, created_at desc);
create index generated_posts_user_created_idx on public.generated_posts (user_id, created_at desc);
create index generated_posts_user_schedule_idx on public.generated_posts (user_id, scheduled_for) where scheduled_for is not null;
create index media_assets_user_post_idx on public.media_assets (user_id, post_id);
create index publishing_jobs_user_schedule_idx on public.publishing_jobs (user_id, scheduled_for);
create index social_accounts_user_platform_idx on public.social_accounts (user_id, platform);

create trigger touch_content_ideas_updated_at
before update on public.content_ideas
for each row execute function public.touch_updated_at();

create trigger touch_generated_posts_updated_at
before update on public.generated_posts
for each row execute function public.touch_updated_at();

create trigger touch_publishing_jobs_updated_at
before update on public.publishing_jobs
for each row execute function public.touch_updated_at();

create trigger touch_social_accounts_updated_at
before update on public.social_accounts
for each row execute function public.touch_updated_at();

alter table public.content_ideas enable row level security;
alter table public.generated_posts enable row level security;
alter table public.media_assets enable row level security;
alter table public.post_analytics enable row level security;
alter table public.publishing_jobs enable row level security;
alter table public.social_accounts enable row level security;

create policy "content_ideas_select_own" on public.content_ideas for select using (auth.uid() = user_id);
create policy "content_ideas_insert_own" on public.content_ideas for insert with check (auth.uid() = user_id);
create policy "content_ideas_update_own" on public.content_ideas for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "content_ideas_delete_own" on public.content_ideas for delete using (auth.uid() = user_id);

create policy "generated_posts_select_own" on public.generated_posts for select using (auth.uid() = user_id);
create policy "generated_posts_insert_own" on public.generated_posts for insert with check (auth.uid() = user_id);
create policy "generated_posts_update_own" on public.generated_posts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "generated_posts_delete_own" on public.generated_posts for delete using (auth.uid() = user_id);

create policy "media_assets_select_own" on public.media_assets for select using (auth.uid() = user_id);
create policy "media_assets_insert_own" on public.media_assets for insert with check (auth.uid() = user_id);
create policy "media_assets_update_own" on public.media_assets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "media_assets_delete_own" on public.media_assets for delete using (auth.uid() = user_id);

create policy "post_analytics_select_own" on public.post_analytics for select using (auth.uid() = user_id);
create policy "post_analytics_insert_own" on public.post_analytics for insert with check (auth.uid() = user_id);
create policy "post_analytics_update_own" on public.post_analytics for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "post_analytics_delete_own" on public.post_analytics for delete using (auth.uid() = user_id);

create policy "publishing_jobs_select_own" on public.publishing_jobs for select using (auth.uid() = user_id);
create policy "publishing_jobs_insert_own" on public.publishing_jobs for insert with check (auth.uid() = user_id);
create policy "publishing_jobs_update_own" on public.publishing_jobs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "publishing_jobs_delete_own" on public.publishing_jobs for delete using (auth.uid() = user_id);

create policy "social_accounts_select_own" on public.social_accounts for select using (auth.uid() = user_id);
create policy "social_accounts_insert_own" on public.social_accounts for insert with check (auth.uid() = user_id);
create policy "social_accounts_update_own" on public.social_accounts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "social_accounts_delete_own" on public.social_accounts for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "post_images_select_own_folder"
on storage.objects for select
using (
  bucket_id = 'post-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "post_images_insert_own_folder"
on storage.objects for insert
with check (
  bucket_id = 'post-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "post_images_update_own_folder"
on storage.objects for update
using (
  bucket_id = 'post-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'post-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "post_images_delete_own_folder"
on storage.objects for delete
using (
  bucket_id = 'post-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);
