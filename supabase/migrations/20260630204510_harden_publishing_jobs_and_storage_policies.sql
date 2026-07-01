alter table public.publishing_jobs
drop constraint if exists publishing_jobs_status_check;

alter table public.publishing_jobs
add constraint publishing_jobs_status_check
check (
  status in ('queued', 'processing', 'ready', 'published', 'failed', 'cancelled')
);

create unique index if not exists publishing_jobs_post_platform_unique_idx
on public.publishing_jobs (post_id, platform);

drop policy if exists "post_images_select_own_folder" on storage.objects;
drop policy if exists "post_images_insert_own_folder" on storage.objects;
drop policy if exists "post_images_update_own_folder" on storage.objects;
drop policy if exists "post_images_delete_own_folder" on storage.objects;

create policy "post_images_select_own_folder"
on storage.objects for select
to authenticated
using (
  bucket_id = 'post-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "post_images_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'post-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "post_images_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'post-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'post-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "post_images_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'post-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
