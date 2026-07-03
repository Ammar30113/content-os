-- Hot-path indexes for the two admin-client sweeps that currently sequential-scan
-- because every existing index leads with user_id/post_id.

-- Buffer cron: filters publishing_jobs by status in ('queued','failed'), a
-- scheduled_for range, and orders by scheduled_for.
create index if not exists publishing_jobs_status_scheduled_idx
  on public.publishing_jobs (status, scheduled_for);

-- Scheduled-retention cron: scans generated_posts where status = 'scheduled'
-- ordered by created_at. A partial index keeps it small and matches the filter.
create index if not exists generated_posts_scheduled_created_idx
  on public.generated_posts (created_at)
  where status = 'scheduled';

-- Constrain publishing_jobs.platform to the same set generated_posts.platform
-- already enforces, so an invalid value fails at write time instead of surfacing
-- much later in normalizePublishPlatform().
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'publishing_jobs_platform_check'
  ) then
    alter table public.publishing_jobs
      add constraint publishing_jobs_platform_check
      check (platform in ('instagram', 'x', 'linkedin'));
  end if;
end $$;
