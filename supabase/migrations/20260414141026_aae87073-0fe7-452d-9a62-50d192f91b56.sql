
-- Add admin_notes column to cook_menus
ALTER TABLE public.cook_menus ADD COLUMN IF NOT EXISTS admin_notes text DEFAULT NULL;

-- Create menu-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-photos', 'menu-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for menu photos
CREATE POLICY "Anyone can view menu photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-photos');

-- Operators can upload menu photos
CREATE POLICY "Operators upload menu photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'menu-photos' AND ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'operator');

-- Operators can update menu photos
CREATE POLICY "Operators update menu photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'menu-photos' AND ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'operator');

-- Operators can delete menu photos
CREATE POLICY "Operators delete menu photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'menu-photos' AND ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'operator');
