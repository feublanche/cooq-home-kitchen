
-- FIX 1: Replace overly-permissive bookings SELECT policy
DROP POLICY IF EXISTS "Customer reads own booking by email" ON public.bookings;

-- Authenticated customers read own bookings by email
CREATE POLICY "Customer reads own booking by email"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (email = (auth.jwt() ->> 'email'));

-- FIX 2: Allow customers to update their own booking rating (for RateSession)
CREATE POLICY "Customer can rate own booking"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (email = (auth.jwt() ->> 'email'))
  WITH CHECK (email = (auth.jwt() ->> 'email'));

-- FIX 3: Create RPC for public rating page (limited fields, single booking by UUID)
CREATE OR REPLACE FUNCTION public.get_booking_for_rating(booking_uuid uuid)
RETURNS TABLE(id uuid, cook_name text, menu_selected text, booking_date text, status text, rating integer, rated_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.cook_name, b.menu_selected, b.booking_date, b.status, b.rating, b.rated_at
  FROM public.bookings b
  WHERE b.id = booking_uuid;
$$;

-- RPC for submitting rating without auth
CREATE OR REPLACE FUNCTION public.submit_booking_rating(booking_uuid uuid, p_rating integer, p_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  UPDATE public.bookings
  SET rating = p_rating, rating_note = p_note, rated_at = now()
  WHERE id = booking_uuid AND rating IS NULL;
END;
$$;

-- FIX 4: Restrict quality_photos policies
DROP POLICY IF EXISTS "Anyone can insert quality photos" ON public.quality_photos;
DROP POLICY IF EXISTS "Anyone can update quality photos" ON public.quality_photos;
DROP POLICY IF EXISTS "Anyone can view quality photos" ON public.quality_photos;

-- Cooks insert their own photos
CREATE POLICY "Cook inserts own photos"
  ON public.quality_photos FOR INSERT
  TO authenticated
  WITH CHECK (cook_id IN (SELECT id::text FROM public.cooks WHERE user_id = auth.uid()));

-- Cooks view their own photos
CREATE POLICY "Cook views own photos"
  ON public.quality_photos FOR SELECT
  TO authenticated
  USING (cook_id IN (SELECT id::text FROM public.cooks WHERE user_id = auth.uid()));

-- Operator views all photos
CREATE POLICY "Operator views all photos"
  ON public.quality_photos FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'cooqdubai@gmail.com');

-- Operator updates all photos (approve/reject)
CREATE POLICY "Operator updates all photos"
  ON public.quality_photos FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'cooqdubai@gmail.com');

-- FIX 5: Operator can UPDATE cooks (approve/reject status)
CREATE POLICY "Operator updates cooks"
  ON public.cooks FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'cooqdubai@gmail.com');

-- Operator can read all cooks
CREATE POLICY "Operator reads all cooks"
  ON public.cooks FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'cooqdubai@gmail.com');

-- FIX 6: Operator can UPDATE cook_menus (approve/reject)
CREATE POLICY "Operator updates cook menus"
  ON public.cook_menus FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'cooqdubai@gmail.com');

-- Operator can read all cook_menus
CREATE POLICY "Operator reads all cook menus"
  ON public.cook_menus FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'cooqdubai@gmail.com');
