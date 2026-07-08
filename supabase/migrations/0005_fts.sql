-- Full-text search via trigger (generated columns require IMMUTABLE, which
-- to_tsvector does not satisfy in Supabase's Postgres build)

ALTER TABLE notes ADD COLUMN IF NOT EXISTS fts tsvector;

CREATE OR REPLACE FUNCTION notes_fts_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.fts :=
    setweight(to_tsvector('english', coalesce(NEW.title,   '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$;

CREATE TRIGGER notes_fts_trigger
  BEFORE INSERT OR UPDATE OF title, summary, tags ON notes
  FOR EACH ROW EXECUTE FUNCTION notes_fts_update();

-- Backfill any existing rows
UPDATE notes SET fts =
  setweight(to_tsvector('english', coalesce(title,   '')), 'A') ||
  setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C');

CREATE INDEX IF NOT EXISTS notes_fts_idx ON notes USING GIN (fts);
