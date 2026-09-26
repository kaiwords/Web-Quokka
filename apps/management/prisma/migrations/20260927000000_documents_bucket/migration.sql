-- Private Supabase Storage bucket for uploaded documents (src/lib/documents.ts).
-- Not public: the app reads and writes it with the service role key and serves
-- files only through its own authenticated routes. Supabase's storage schema
-- already enables RLS on storage.objects, and no policy is added, so the anon
-- and authenticated API roles cannot reach these files.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', false, 10485760)
ON CONFLICT (id) DO NOTHING;
