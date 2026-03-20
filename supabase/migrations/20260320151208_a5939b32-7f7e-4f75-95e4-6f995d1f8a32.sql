-- Make proof-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'proof-photos';

-- Replace rating RPCs with auth-checked versions
CREATE OR REPLACE FUNCTION public.submit_booking_rating(booking_uuid uuid, p_rating integer, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_customer_user_id uuid;
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  -- Verify the caller owns this booking
  SELECT customer_user_id INTO v_customer_user_id
  FROM public.bookings WHERE id = booking_uuid;

  IF v_customer_user_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF auth.uid() IS NULL OR auth.uid() != v_customer_user_id THEN
    RAISE EXCEPTION 'Not authorized to rate this booking';
  END IF;

  UPDATE public.bookings
  SET rating = p_rating, rating_note = p_note, rated_at = now()
  WHERE id = booking_uuid AND rating IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_booking_for_rating(booking_uuid uuid)
 RETURNS TABLE(id uuid, cook_name text, menu_selected text, booking_date text, status text, rating integer, rated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_customer_user_id uuid;
BEGIN
  -- Verify the caller owns this booking
  SELECT b.customer_user_id INTO v_customer_user_id
  FROM public.bookings b WHERE b.id = booking_uuid;

  IF auth.uid() IS NULL OR auth.uid() != v_customer_user_id THEN
    RAISE EXCEPTION 'Not authorized to view this booking';
  END IF;

  RETURN QUERY
  SELECT b.id, b.cook_name, b.menu_selected, b.booking_date, b.status, b.rating, b.rated_at
  FROM public.bookings b
  WHERE b.id = booking_uuid;
END;
$$;