-- Grant table-level access to all roles used by PostgREST.
-- Tables created via SQL migrations don't get these automatically (unlike dashboard-created tables).
-- RLS policies still control what anon/authenticated can actually read or write.

grant all on table public.topics       to anon, authenticated, service_role;
grant all on table public.notes        to anon, authenticated, service_role;
grant all on table public.authors      to anon, authenticated, service_role;
grant all on table public.push_tokens  to anon, authenticated, service_role;

-- Sequences (needed for tables with serial/identity primary keys, if any)
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
