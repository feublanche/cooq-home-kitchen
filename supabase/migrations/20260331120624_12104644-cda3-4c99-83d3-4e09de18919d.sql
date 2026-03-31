
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS taste_rating integer,
  ADD COLUMN IF NOT EXISTS punctuality_rating integer,
  ADD COLUMN IF NOT EXISTS cleanliness_rating integer,
  ADD COLUMN IF NOT EXISTS communication_rating integer;

CREATE OR REPLACE FUNCTION public.submit_booking_rating(
  booking_uuid uuid,
  p_rating integer,
  p_note text DEFAULT NULL,
  p_taste integer DEFAULT NULL,
  p_punctuality integer DEFAULT NULL,
  p_cleanliness integer DEFAULT NULL,
  p_communication integer DEFAULT NULL
)
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

  SELECT customer_user_id INTO v_customer_user_id
  FROM public.bookings WHERE id = booking_uuid;

  IF v_customer_user_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF auth.uid() IS NULL OR auth.uid() != v_customer_user_id THEN
    RAISE EXCEPTION 'Not authorized to rate this booking';
  END IF;

  UPDATE public.bookings
  SET rating = p_rating,
      rating_note = p_note,
      rated_at = now(),
      taste_rating = p_taste,
      punctuality_rating = p_punctuality,
      cleanliness_rating = p_cleanliness,
      communication_rating = p_communication
  WHERE id = booking_uuid AND rating IS NULL;
END;
$$;
