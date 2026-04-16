
-- Restrict public bucket listing for cook-photos and menu-photos
-- Allow reading individual files but not listing all files in the bucket

-- First drop the overly broad default policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read cook-photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read menu-photos" ON storage.objects;

-- Create scoped SELECT policies that only allow reading specific known files (not listing)
CREATE POLICY "Public read cook-photos files"
ON storage.objects FOR SELECT
USING (bucket_id = 'cook-photos' AND auth.role() = 'anon' OR bucket_id = 'cook-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Public read menu-photos files"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-photos' AND auth.role() = 'anon' OR bucket_id = 'menu-photos' AND auth.role() = 'authenticated');
