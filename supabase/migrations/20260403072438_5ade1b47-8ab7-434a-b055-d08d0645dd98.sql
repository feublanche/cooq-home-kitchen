-- Fix 1: Change "Cook reads own bookings" policy from public to authenticated
DROP POLICY IF EXISTS "Cook reads own bookings" ON public.bookings;
CREATE POLICY "Cook reads own bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (cook_id IN (
    SELECT id::text FROM public.cooks WHERE user_id = auth.uid()
  ));

-- Fix 2: Tighten proof-photos storage policies
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow authenticated uploads to proof-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from proof-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to proof-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from proof-photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload proof photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read proof photos" ON storage.objects;
DROP POLICY IF EXISTS "Cook uploads own proof photos" ON storage.objects;
DROP POLICY IF EXISTS "Cook reads own proof photos" ON storage.objects;
DROP POLICY IF EXISTS "Operator reads all proof photos" ON storage.objects;

-- Cooks can upload to their own folder only
CREATE POLICY "Cook uploads own proof photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'proof-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.cooks WHERE user_id = auth.uid()
    )
  );

-- Cooks can view their own photos only
CREATE POLICY "Cook reads own proof photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'proof-photos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.cooks WHERE user_id = auth.uid()
    )
  );

-- Operator can view all proof photos
CREATE POLICY "Operator reads all proof photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'proof-photos'
    AND (auth.jwt() ->> 'email') = 'cooqdubai@gmail.com'
  );