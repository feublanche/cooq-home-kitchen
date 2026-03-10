
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  area TEXT,
  address TEXT,
  cook_id TEXT NOT NULL,
  cook_name TEXT NOT NULL,
  menu_selected TEXT NOT NULL,
  booking_date TEXT,
  frequency TEXT,
  party_size INTEGER DEFAULT 2,
  dietary TEXT[] DEFAULT '{}',
  allergies_notes TEXT,
  grocery_addon BOOLEAN DEFAULT false,
  total_aed INTEGER DEFAULT 350,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert bookings (public form, no auth required)
CREATE POLICY "Anyone can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read bookings (admin page, no auth for MVP)
CREATE POLICY "Anyone can read bookings" ON public.bookings
  FOR SELECT USING (true);

-- Allow anyone to update bookings (admin status changes)
CREATE POLICY "Anyone can update bookings" ON public.bookings
  FOR UPDATE USING (true);
