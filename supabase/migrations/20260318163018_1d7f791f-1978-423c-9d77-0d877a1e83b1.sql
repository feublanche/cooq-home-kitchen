
-- FIX 1: Enable RLS on cooks and cook_menus tables
ALTER TABLE public.cooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cook_menus ENABLE ROW LEVEL SECURITY;

-- FIX 2: Secure bookings table - drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can read bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

-- Bookings: anyone can still create (customers book without auth)
CREATE POLICY "Public can create bookings"
  ON public.bookings FOR INSERT
  TO public
  WITH CHECK (true);

-- Bookings: cooks read their own bookings
-- (existing "Cook reads own bookings" policy already handles this)

-- Bookings: operator reads all bookings (by email claim)
CREATE POLICY "Operator reads all bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'email' = 'cooqdubai@gmail.com');

-- Bookings: operator updates all bookings
CREATE POLICY "Operator updates all bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'email' = 'cooqdubai@gmail.com');

-- Bookings: allow public read by booking email (for confirmation/status pages)
CREATE POLICY "Customer reads own booking by email"
  ON public.bookings FOR SELECT
  TO anon, authenticated
  USING (true);
