
-- Storage bucket for proof of quality photos
INSERT INTO storage.buckets (id, name, public) VALUES ('proof-photos', 'proof-photos', true);

-- RLS policies for proof-photos bucket
CREATE POLICY "Anyone can upload proof photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'proof-photos');

CREATE POLICY "Anyone can view proof photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'proof-photos');

-- Quality photos tracking table
CREATE TABLE public.quality_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  cook_id TEXT NOT NULL,
  cook_name TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('container', 'kitchen')),
  photo_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT NULL
);

ALTER TABLE public.quality_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert quality photos" ON public.quality_photos FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can view quality photos" ON public.quality_photos FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can update quality photos" ON public.quality_photos FOR UPDATE TO public USING (true);

-- Menu vetting status on bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS menu_status TEXT DEFAULT 'pending_review';
