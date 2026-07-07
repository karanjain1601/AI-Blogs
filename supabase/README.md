# Supabase

Database schema for Engineering Notes. Applies to any Postgres, but assumes Supabase
(RLS + anon/service-role keys + `security definer` RPCs).

## Files

- `migrations/0001_init.sql` — tables, indexes, full-text search, triggers, RLS, RPCs.
- `seed.sql` — sample topic tree + two cross-linked demo notes.

## Apply

**Option A — Supabase dashboard:** paste each file into the SQL editor and run
`0001_init.sql`, then `seed.sql`.

**Option B — Supabase CLI:**

```bash
supabase db push          # applies migrations/
psql "$DATABASE_URL" -f supabase/seed.sql
```

## Notes

- **Writes** go only through the admin server using the **service-role key**, which
  bypasses RLS — so there are intentionally no INSERT/UPDATE/DELETE policies.
- **Public reads** (anon key) are limited by RLS to `published` / `evergreen` notes.
- `search_tsv` and `updated_at` are maintained by triggers; `note_links` and
  `reading_time` are computed by the admin save pipeline (Phase 2).
- Public mutations are limited to two rate-limited RPCs: `increment_view` and
  `increment_reaction`.
