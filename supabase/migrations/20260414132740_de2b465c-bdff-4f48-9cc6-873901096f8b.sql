
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS proof_status text DEFAULT NULL;
