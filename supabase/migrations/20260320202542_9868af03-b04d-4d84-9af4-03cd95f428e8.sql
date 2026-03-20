DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;

CREATE POLICY "Authenticated users create own bookings"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_user_id = auth.uid());