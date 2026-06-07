-- Content OS v2 (Phase 1): add the Rallio strategy pillar and the engagement
-- framework (primary/secondary goal) as first-class, queryable columns on
-- generated_posts. These are decoupled from the generic pillar/template_type
-- (visual-format) enum. Values are assigned deterministically per content type
-- in normalizeRallioMetadata(); Phase 2 makes generation vary by primary_goal,
-- and Phase 5 aggregates engagement by these columns.

alter table public.generated_posts
  add column if not exists rallio_pillar text
    check (
      rallio_pillar is null
      or rallio_pillar in (
        'discovery',
        'debate',
        'community',
        'ranking',
        'product'
      )
    ),
  add column if not exists primary_goal text
    check (
      primary_goal is null
      or primary_goal in ('save', 'share', 'comment', 'download')
    ),
  add column if not exists secondary_goal text
    check (
      secondary_goal is null
      or secondary_goal in (
        'brand_awareness',
        'user_submission',
        'community_building'
      )
    );

create index if not exists generated_posts_rallio_pillar_idx
  on public.generated_posts (user_id, rallio_pillar);

create index if not exists generated_posts_primary_goal_idx
  on public.generated_posts (user_id, primary_goal);
