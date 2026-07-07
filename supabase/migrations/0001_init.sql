-- ════════════════════════════════════════════════════════════════════════
-- Engineering Notes — initial schema
-- Tables, indexes, full-text search, triggers, RLS, and public RPCs.
-- Writes happen only via the admin server (service-role key, bypasses RLS).
-- Public web + mobile read with the anon key, constrained by RLS below.
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ─────────────────────────────── topics ────────────────────────────────
create table if not exists public.topics (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text,
  icon        text,
  cover_image text,
  parent_id   uuid references public.topics(id) on delete set null,
  sort_order  int not null default 0
);

create index if not exists topics_parent_idx on public.topics(parent_id);

-- ──────────────────────────────── notes ────────────────────────────────
create table if not exists public.notes (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  aliases        text[] not null default '{}',
  title          text not null,
  summary        text,
  icon           text,
  cover_image    text,
  topic_id       uuid references public.topics(id) on delete set null,
  parent_note_id uuid references public.notes(id) on delete set null,
  tags           text[] not null default '{}',
  status         text not null default 'draft'
                   check (status in ('draft','scheduled','published','evergreen')),
  publish_at     timestamptz,
  sort_order     int not null default 0,
  blocks         jsonb not null default '[]'::jsonb,
  metadata       jsonb not null default '{}'::jsonb,
  reading_time   int not null default 0,
  view_count     int not null default 0,
  preview_token  uuid not null default gen_random_uuid(),
  search_tsv     tsvector,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists notes_topic_idx    on public.notes(topic_id);
create index if not exists notes_parent_idx    on public.notes(parent_note_id);
create index if not exists notes_status_idx    on public.notes(status, updated_at desc);
create index if not exists notes_tags_idx      on public.notes using gin (tags);
create index if not exists notes_aliases_idx   on public.notes using gin (aliases);
create index if not exists notes_search_idx    on public.notes using gin (search_tsv);

-- ─────────────────────── note_links (backlinks/graph) ───────────────────
create table if not exists public.note_links (
  source_note_id uuid not null references public.notes(id) on delete cascade,
  target_note_id uuid not null references public.notes(id) on delete cascade,
  link_kind      text not null default 'link' check (link_kind in ('link','embed')),
  primary key (source_note_id, target_note_id, link_kind)
);

create index if not exists note_links_target_idx on public.note_links(target_note_id);

-- ──────────────────────── note_revisions (history) ──────────────────────
create table if not exists public.note_revisions (
  id         uuid primary key default gen_random_uuid(),
  note_id    uuid not null references public.notes(id) on delete cascade,
  title      text not null,
  blocks     jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists note_revisions_note_idx
  on public.note_revisions(note_id, created_at desc);

-- ──────────────────────────── reactions ────────────────────────────────
create table if not exists public.reactions (
  note_id uuid not null references public.notes(id) on delete cascade,
  emoji   text not null,
  count   int not null default 0,
  primary key (note_id, emoji)
);

-- ═══════════════════════════════ triggers ══════════════════════════════

-- keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- maintain the full-text index over title + summary + tags + all block text
create or replace function public.notes_search_update()
returns trigger language plpgsql as $$
begin
  new.search_tsv :=
      setweight(to_tsvector('english', coalesce(new.title, '')), 'A')
    || setweight(to_tsvector('english', coalesce(new.summary, '')), 'B')
    || setweight(to_tsvector('english', array_to_string(coalesce(new.tags, '{}'), ' ')), 'C')
    || setweight(jsonb_to_tsvector('english', coalesce(new.blocks, '[]'::jsonb), '["string"]'), 'D');
  return new;
end;
$$;

drop trigger if exists notes_search_tsv on public.notes;
create trigger notes_search_tsv
  before insert or update of title, summary, tags, blocks on public.notes
  for each row execute function public.notes_search_update();

-- ═══════════════════════════════ RLS ═══════════════════════════════════
alter table public.topics          enable row level security;
alter table public.notes           enable row level security;
alter table public.note_links      enable row level security;
alter table public.note_revisions  enable row level security;
alter table public.reactions       enable row level security;

-- Public (anon + authenticated) may READ published/evergreen notes only.
drop policy if exists notes_public_read on public.notes;
create policy notes_public_read on public.notes
  for select using (status in ('published', 'evergreen'));

-- Topics, links and reactions are world-readable.
drop policy if exists topics_public_read on public.topics;
create policy topics_public_read on public.topics for select using (true);

drop policy if exists note_links_public_read on public.note_links;
create policy note_links_public_read on public.note_links for select using (true);

drop policy if exists reactions_public_read on public.reactions;
create policy reactions_public_read on public.reactions for select using (true);

-- note_revisions: NO public policies → only the service role (admin) can touch it.
-- All writes to every table go through the admin server's service-role key,
-- which bypasses RLS, so no INSERT/UPDATE/DELETE policies are defined here.

-- ═══════════════════════════════ RPCs ══════════════════════════════════
-- Controlled, public-callable mutations (rate-limited at the app layer).

create or replace function public.increment_view(p_note_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.notes
     set view_count = view_count + 1
   where id = p_note_id and status in ('published', 'evergreen');
$$;

create or replace function public.increment_reaction(p_note_id uuid, p_emoji text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from public.notes
     where id = p_note_id and status in ('published', 'evergreen')
  ) then
    insert into public.reactions (note_id, emoji, count)
    values (p_note_id, p_emoji, 1)
    on conflict (note_id, emoji)
      do update set count = public.reactions.count + 1;
  end if;
end;
$$;

grant execute on function public.increment_view(uuid)          to anon, authenticated;
grant execute on function public.increment_reaction(uuid, text) to anon, authenticated;
