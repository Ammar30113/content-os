-- Keep helper functions available to triggers while removing direct RPC access.
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

-- Cover foreign keys used by deletes/joins.
create index if not exists generated_posts_idea_id_idx
on public.generated_posts (idea_id);

create index if not exists media_assets_post_id_idx
on public.media_assets (post_id);

create index if not exists post_analytics_post_id_idx
on public.post_analytics (post_id);

create index if not exists post_analytics_user_id_idx
on public.post_analytics (user_id);

create index if not exists publishing_jobs_post_id_idx
on public.publishing_jobs (post_id);

-- Avoid re-evaluating auth.uid() per row in RLS policies.
drop policy if exists "content_ideas_select_own" on public.content_ideas;
drop policy if exists "content_ideas_insert_own" on public.content_ideas;
drop policy if exists "content_ideas_update_own" on public.content_ideas;
drop policy if exists "content_ideas_delete_own" on public.content_ideas;

create policy "content_ideas_select_own" on public.content_ideas
for select using ((select auth.uid()) = user_id);
create policy "content_ideas_insert_own" on public.content_ideas
for insert with check ((select auth.uid()) = user_id);
create policy "content_ideas_update_own" on public.content_ideas
for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "content_ideas_delete_own" on public.content_ideas
for delete using ((select auth.uid()) = user_id);

drop policy if exists "generated_posts_select_own" on public.generated_posts;
drop policy if exists "generated_posts_insert_own" on public.generated_posts;
drop policy if exists "generated_posts_update_own" on public.generated_posts;
drop policy if exists "generated_posts_delete_own" on public.generated_posts;

create policy "generated_posts_select_own" on public.generated_posts
for select using ((select auth.uid()) = user_id);
create policy "generated_posts_insert_own" on public.generated_posts
for insert with check ((select auth.uid()) = user_id);
create policy "generated_posts_update_own" on public.generated_posts
for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "generated_posts_delete_own" on public.generated_posts
for delete using ((select auth.uid()) = user_id);

drop policy if exists "media_assets_select_own" on public.media_assets;
drop policy if exists "media_assets_insert_own" on public.media_assets;
drop policy if exists "media_assets_update_own" on public.media_assets;
drop policy if exists "media_assets_delete_own" on public.media_assets;

create policy "media_assets_select_own" on public.media_assets
for select using ((select auth.uid()) = user_id);
create policy "media_assets_insert_own" on public.media_assets
for insert with check ((select auth.uid()) = user_id);
create policy "media_assets_update_own" on public.media_assets
for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "media_assets_delete_own" on public.media_assets
for delete using ((select auth.uid()) = user_id);

drop policy if exists "post_analytics_select_own" on public.post_analytics;
drop policy if exists "post_analytics_insert_own" on public.post_analytics;
drop policy if exists "post_analytics_update_own" on public.post_analytics;
drop policy if exists "post_analytics_delete_own" on public.post_analytics;

create policy "post_analytics_select_own" on public.post_analytics
for select using ((select auth.uid()) = user_id);
create policy "post_analytics_insert_own" on public.post_analytics
for insert with check ((select auth.uid()) = user_id);
create policy "post_analytics_update_own" on public.post_analytics
for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "post_analytics_delete_own" on public.post_analytics
for delete using ((select auth.uid()) = user_id);

drop policy if exists "publishing_jobs_select_own" on public.publishing_jobs;
drop policy if exists "publishing_jobs_insert_own" on public.publishing_jobs;
drop policy if exists "publishing_jobs_update_own" on public.publishing_jobs;
drop policy if exists "publishing_jobs_delete_own" on public.publishing_jobs;

create policy "publishing_jobs_select_own" on public.publishing_jobs
for select using ((select auth.uid()) = user_id);
create policy "publishing_jobs_insert_own" on public.publishing_jobs
for insert with check ((select auth.uid()) = user_id);
create policy "publishing_jobs_update_own" on public.publishing_jobs
for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "publishing_jobs_delete_own" on public.publishing_jobs
for delete using ((select auth.uid()) = user_id);

drop policy if exists "social_accounts_select_own" on public.social_accounts;
drop policy if exists "social_accounts_insert_own" on public.social_accounts;
drop policy if exists "social_accounts_update_own" on public.social_accounts;
drop policy if exists "social_accounts_delete_own" on public.social_accounts;

create policy "social_accounts_select_own" on public.social_accounts
for select using ((select auth.uid()) = user_id);
create policy "social_accounts_insert_own" on public.social_accounts
for insert with check ((select auth.uid()) = user_id);
create policy "social_accounts_update_own" on public.social_accounts
for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "social_accounts_delete_own" on public.social_accounts
for delete using ((select auth.uid()) = user_id);
