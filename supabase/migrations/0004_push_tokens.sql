CREATE TABLE push_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token      text NOT NULL UNIQUE,
  platform   text NOT NULL CHECK (platform IN ('ios','android')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_tokens_platform ON push_tokens(platform);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
-- No SELECT policy: tokens are write-only from the app, read by service role only
-- INSERT via API route using service role
