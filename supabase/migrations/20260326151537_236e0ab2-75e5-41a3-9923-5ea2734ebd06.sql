
-- Create a public-safe view that excludes sensitive columns
CREATE OR REPLACE VIEW public.public_cooks AS
SELECT id, name, bio, cuisine, area, years_experience, health_card, photo_url, status
FROM public.cooks
WHERE status IN ('approved', 'active');

-- Grant access to the view for anon and authenticated roles
GRANT SELECT ON public.public_cooks TO anon, authenticated;

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public reads approved cooks" ON public.cooks;
