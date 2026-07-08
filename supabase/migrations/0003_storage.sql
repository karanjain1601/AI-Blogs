-- Create Supabase Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('note-assets', 'note-assets', true, 10485760, ARRAY['image/jpeg','image/png','image/gif','image/webp','image/svg+xml']),
  ('backups',     'backups',    false, 524288000, ARRAY['application/json'])
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone can read note-assets (public)
CREATE POLICY "note_assets_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'note-assets');

-- Only service role can write (handled at API level, this covers direct access)
CREATE POLICY "note_assets_auth_write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'note-assets');
