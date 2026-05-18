-- Drop debug SECURITY DEFINER functions that exposed sensitive data publicly
DROP FUNCTION IF EXISTS public.list_all_cooks();
DROP FUNCTION IF EXISTS public.check_cooks_maria();
DROP FUNCTION IF EXISTS public.show_invalid_bookings();
DROP FUNCTION IF EXISTS public.count_bad_bookings();
DROP FUNCTION IF EXISTS public.get_cooks_rls();
DROP FUNCTION IF EXISTS public.get_cooks_triggers();
DROP FUNCTION IF EXISTS public.get_cooks_cols();

-- Lock down remaining SECURITY DEFINER helpers to authenticated callers only.
-- These already perform internal auth.uid() checks; revoke broad EXECUTE just in case.
REVOKE EXECUTE ON FUNCTION public.submit_booking_rating(uuid, integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_booking_rating(uuid, integer, text, integer, integer, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_booking_for_rating(uuid) FROM PUBLIC, anon;

-- Remove the conflicting auth.uid()-based storage policies for cook-documents.
-- The cooks.id-based policies remain, matching how files are actually uploaded.
DROP POLICY IF EXISTS "Cook uploads own docs" ON storage.objects;
DROP POLICY IF EXISTS "Cook views own docs" ON storage.objects;
