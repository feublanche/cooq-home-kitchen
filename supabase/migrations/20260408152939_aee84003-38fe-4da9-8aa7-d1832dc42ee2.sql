
-- 1. Remove public storage policies on proof-photos
DROP POLICY IF EXISTS "Anyone can view proof photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload proof photos" ON storage.objects;

-- 2. Fix bookings customer read policy: use auth.uid() instead of email
DROP POLICY IF EXISTS "Customer reads own booking by email" ON public.bookings;
CREATE POLICY "Customer reads own bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (customer_user_id = auth.uid());

-- 3. Set operator role in app_metadata
UPDATE auth.users 
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "operator"}'::jsonb 
WHERE email = 'cooqdubai@gmail.com';

-- 4. Replace all operator email-based RLS policies with app_metadata role check

-- bookings
DROP POLICY IF EXISTS "Operator reads all bookings" ON public.bookings;
CREATE POLICY "Operator reads all bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'operator');

DROP POLICY IF EXISTS "Operator updates all bookings" ON public.bookings;
CREATE POLICY "Operator updates all bookings"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'operator');

-- cooks
DROP POLICY IF EXISTS "Operator reads all cooks" ON public.cooks;
CREATE POLICY "Operator reads all cooks"
  ON public.cooks
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'operator');

DROP POLICY IF EXISTS "Operator updates cooks" ON public.cooks;
CREATE POLICY "Operator updates cooks"
  ON public.cooks
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'operator');

-- cook_menus
DROP POLICY IF EXISTS "Operator reads all cook menus" ON public.cook_menus;
CREATE POLICY "Operator reads all cook menus"
  ON public.cook_menus
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'operator');

DROP POLICY IF EXISTS "Operator updates cook menus" ON public.cook_menus;
CREATE POLICY "Operator updates cook menus"
  ON public.cook_menus
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'operator');

-- quality_photos
DROP POLICY IF EXISTS "Operator views all photos" ON public.quality_photos;
CREATE POLICY "Operator views all photos"
  ON public.quality_photos
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'operator');

DROP POLICY IF EXISTS "Operator updates all photos" ON public.quality_photos;
CREATE POLICY "Operator updates all photos"
  ON public.quality_photos
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'operator');

-- storage: operator reads all proof photos
DROP POLICY IF EXISTS "Operator reads all proof photos" ON storage.objects;
CREATE POLICY "Operator reads all proof photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'proof-photos' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'operator');
