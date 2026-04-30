alter table public.generated_posts
drop constraint if exists generated_posts_pillar_check;

alter table public.generated_posts
add constraint generated_posts_pillar_check
check (
  pillar is null
  or pillar in (
    'news_digest',
    'tool_stack',
    'tutorial',
    'creator_economy',
    'founder_story',
    'meme'
  )
);

alter table public.generated_posts
drop constraint if exists generated_posts_template_type_check;

alter table public.generated_posts
add constraint generated_posts_template_type_check
check (
  template_type is null
  or template_type in (
    'news_digest',
    'tool_stack',
    'tutorial',
    'creator_economy',
    'founder_story',
    'meme'
  )
);
