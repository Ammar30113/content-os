-- Add first-class manual video handoff fields for Rallio Reels.
-- This keeps video generation outside the API path so Google AI Pro / Flow can
-- be used manually without introducing per-second Veo API billing.

alter table public.generated_posts
  add column if not exists video_url text,
  add column if not exists video_status text not null default 'not_required'
    check (video_status in ('not_required', 'missing', 'uploaded', 'failed')),
  add column if not exists video_error text,
  add column if not exists video_source text
    check (
      video_source is null
      or video_source in ('manual_url', 'upload')
    );

create index if not exists generated_posts_user_video_status_idx
  on public.generated_posts (user_id, video_status);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  104857600,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'video/mp4',
    'video/quicktime'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
