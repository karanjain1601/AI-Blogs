-- Add generated tsvector column for full-text search
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS fts tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english'::regconfig, coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english'::regconfig, coalesce(summary, '')), 'B') ||
      setweight(to_tsvector('english'::regconfig, coalesce(array_to_string(tags, ' '), '')), 'C')
    ) STORED;

CREATE INDEX IF NOT EXISTS notes_fts_idx ON notes USING GIN (fts);
