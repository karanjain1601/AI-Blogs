-- ════════════════════════════════════════════════════════════════════════
-- Seed data — sample engineering topic tree + two cross-linked demo notes.
-- Safe to re-run (idempotent via ON CONFLICT).
-- ════════════════════════════════════════════════════════════════════════

-- top-level topics
insert into public.topics (slug, name, description, icon, sort_order) values
  ('system-design',       'System Design',       'Fundamentals, building blocks, case studies', 'building', 1),
  ('databases',           'Databases',           'Indexing, transactions, SQL vs NoSQL',        'database', 2),
  ('distributed-systems', 'Distributed Systems', 'Consensus, replication, partitioning',        'globe',    3)
on conflict (slug) do nothing;

-- child topic under Databases
insert into public.topics (slug, name, description, parent_id, sort_order)
select 'databases-indexing', 'Indexing & Query Planning',
       'How indexes work and when to use them', t.id, 1
from public.topics t where t.slug = 'databases'
on conflict (slug) do nothing;

-- demo note 1 — under Databases › Indexing
insert into public.notes (slug, title, summary, topic_id, tags, status, blocks)
select
  'database-indexing',
  'Database Indexing',
  'How B-tree indexes speed up reads and what they cost on writes.',
  t.id,
  array['databases','performance','sql'],
  'evergreen',
  $json$[
    {"type":"heading","level":1,"content":"Database Indexing"},
    {"type":"text","content":"An **index** is a data structure that speeds up lookups at the cost of extra writes and storage. Distributed stores add their own wrinkles — see [[consensus|how replicas agree]]."},
    {"type":"callout","variant":"tip","title":"Rule of thumb","content":"Index the columns you filter and join on — not every column."},
    {"type":"heading","level":2,"content":"How a B-tree lookup works"},
    {"type":"mermaid","title":"B-tree search path","layout":"tabs","content":"graph TD\n  Root --> A[10..40]\n  Root --> B[50..90]\n  A --> L1[(10,20,30)]\n  B --> L2[(50,60,70)]"},
    {"type":"code","language":"sql","filename":"index.sql","content":"CREATE INDEX idx_users_email ON users (email);\nSELECT * FROM users WHERE email = 'a@b.com';"},
    {"type":"text","content":"Lookup cost is logarithmic in the number of rows:"},
    {"type":"math","display":true,"content":"O(\\log_b n)"},
    {"type":"list","ordered":false,"items":["Speeds up point and range queries","Slows down INSERT / UPDATE / DELETE","Consumes extra disk"]}
  ]$json$::jsonb
from public.topics t where t.slug = 'databases-indexing'
on conflict (slug) do nothing;

-- demo note 2 — under Distributed Systems (the target of the wiki-link above)
insert into public.notes (slug, title, summary, topic_id, tags, status, blocks)
select
  'consensus',
  'Consensus',
  'Why distributed replicas need to agree, and how quorums make that safe.',
  t.id,
  array['distributed-systems','replication'],
  'evergreen',
  $json$[
    {"type":"heading","level":1,"content":"Consensus"},
    {"type":"text","content":"Consensus lets a set of replicas agree on a single value even when some fail. Quorums (majority overlap) are the core trick."},
    {"type":"callout","variant":"note","content":"A write + read quorum that overlap guarantees you read the latest committed value."}
  ]$json$::jsonb
from public.topics t where t.slug = 'distributed-systems'
on conflict (slug) do nothing;

-- a resolved backlink edge for the [[consensus]] link (normally the admin save
-- pipeline computes these; seeded here so backlinks work out of the box)
insert into public.note_links (source_note_id, target_note_id, link_kind)
select s.id, t.id, 'link'
from public.notes s, public.notes t
where s.slug = 'database-indexing' and t.slug = 'consensus'
on conflict do nothing;
