alter table public.media_assets
  drop constraint if exists media_assets_source_check;

alter table public.media_assets
  add constraint media_assets_source_check
  check (source in ('template', 'upload', 'ai', 'carousel_slide'));
