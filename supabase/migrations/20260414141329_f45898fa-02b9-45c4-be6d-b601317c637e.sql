
ALTER TABLE public.cooks ADD COLUMN IF NOT EXISTS doc_notes text DEFAULT NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS proof_notes text DEFAULT NULL;
