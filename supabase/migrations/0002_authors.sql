-- Authors
CREATE TABLE authors (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  bio           text,
  avatar_url    text,
  website_url   text,
  twitter_handle text,
  github_handle  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notes
  ADD COLUMN author_id uuid REFERENCES authors(id) ON DELETE SET NULL;

CREATE INDEX idx_notes_author ON notes(author_id);

-- RLS: authors are public read
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authors_public_read" ON authors FOR SELECT USING (true);

-- Anon can read
GRANT SELECT ON authors TO anon;
