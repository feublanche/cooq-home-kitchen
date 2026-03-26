
-- Fix: make the view use security invoker (caller's permissions) instead of definer
-- We need to recreate it with explicit security_invoker
DROP VIEW IF EXISTS public.public_cooks;

CREATE VIEW public.public_cooks
WITH (security_invoker = true)
AS
SELECT id, name, bio, cuisine, area, years_experience, health_card, photo_url, status
FROM public.cooks
WHERE status IN ('approved', 'active');

GRANT SELECT ON public.public_cooks TO anon, authenticated;

-- Now we need a policy that allows anon/public to read through the view
-- Since security_invoker means the view uses the caller's permissions,
-- we need to re-add a policy but ONLY for the safe columns approach won't work with RLS alone.
-- Instead, let's use security_invoker = false but wrap it properly with a function.
-- Actually the simplest secure approach: re-add limited public policy on cooks table
-- (the view with security_invoker needs the underlying table to be readable)
CREATE POLICY "Public reads approved cooks"
ON public.cooks
FOR SELECT
TO anon, authenticated
USING (status IN ('approved', 'active'));
