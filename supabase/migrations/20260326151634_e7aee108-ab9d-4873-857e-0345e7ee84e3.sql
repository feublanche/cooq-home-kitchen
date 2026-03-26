
-- Remove the public policy that exposes sensitive data
DROP POLICY IF EXISTS "Public reads approved cooks" ON public.cooks;

-- Drop the view since we'll use a function instead
DROP VIEW IF EXISTS public.public_cooks;

-- Create a security definer function that returns only safe columns
CREATE OR REPLACE FUNCTION public.get_public_cooks()
RETURNS TABLE(
  id uuid,
  name text,
  bio text,
  cuisine text[],
  area text,
  years_experience integer,
  health_card boolean,
  photo_url text,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, bio, cuisine, area, years_experience, health_card, photo_url, status
  FROM public.cooks
  WHERE status IN ('approved', 'active');
$$;

-- Create a function to get a single public cook by id
CREATE OR REPLACE FUNCTION public.get_public_cook_by_id(cook_uuid uuid)
RETURNS TABLE(
  id uuid,
  name text,
  bio text,
  cuisine text[],
  area text,
  years_experience integer,
  health_card boolean,
  photo_url text,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, bio, cuisine, area, years_experience, health_card, photo_url, status
  FROM public.cooks
  WHERE id = cook_uuid AND status IN ('approved', 'active');
$$;

-- Fix search_path on existing functions that are missing it
CREATE OR REPLACE FUNCTION public.count_bad_bookings()
RETURNS TABLE(invalid_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY SELECT COUNT(*) FROM public.bookings
  WHERE total_aed NOT IN (299,350,420,550,1190,1430,1870,2380,2860,3740,3570,4280,5610);
END;$function$;

CREATE OR REPLACE FUNCTION public.get_cooks_triggers()
RETURNS TABLE(trig_name text, trig_timing text, trig_event text, trig_func text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT t.tgname::text, 
    CASE WHEN t.tgtype & 2 = 2 THEN 'BEFORE' ELSE 'AFTER' END,
    CASE WHEN t.tgtype & 4 = 4 THEN 'INSERT'
         WHEN t.tgtype & 8 = 8 THEN 'DELETE'
         WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
         ELSE 'OTHER' END,
    p.proname::text
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_proc p ON p.oid = t.tgfoid
  WHERE c.relname = 'cooks' AND NOT t.tgisinternal;
END;$function$;

CREATE OR REPLACE FUNCTION public.get_cooks_rls()
RETURNS TABLE(pol_name text, pol_cmd text, pol_roles text, pol_qual text, pol_with_check text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT p.polname::text, p.polcmd::text, 
    array_to_string(p.polroles::regrole[], ','),
    pg_get_expr(p.polqual, p.polrelid)::text,
    pg_get_expr(p.polwithcheck, p.polrelid)::text
  FROM pg_policy p
  JOIN pg_class c ON c.oid = p.polrelid
  WHERE c.relname = 'cooks';
END;$function$;

CREATE OR REPLACE FUNCTION public.check_cooks_maria()
RETURNS TABLE(cook_id uuid, nm text, uid uuid, st text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY SELECT id, name, user_id, status::text FROM public.cooks WHERE name ILIKE '%maria%';
END;$function$;

CREATE OR REPLACE FUNCTION public.list_all_cooks()
RETURNS TABLE(cook_id uuid, nm text, uid uuid, st text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY SELECT id, name, user_id, status FROM public.cooks ORDER BY name;
END;$function$;

CREATE OR REPLACE FUNCTION public.show_invalid_bookings()
RETURNS TABLE(row_id uuid, customer text, tier_val text, freq_val text, bad_amt integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT id, customer_name, tier::text, frequency::text, total_aed
  FROM public.bookings
  WHERE total_aed NOT IN (299,350,420,550,1190,1430,1870,2380,2860,3740,3570,4280,5610);
END;$function$;

CREATE OR REPLACE FUNCTION public.get_cooks_cols()
RETURNS TABLE(col_name text, col_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT a.attname::text, pg_catalog.format_type(a.atttypid, a.atttypmod)::text
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  WHERE c.relname = 'cooks' AND a.attnum > 0 AND NOT a.attisdropped
  ORDER BY a.attnum;
END;$function$;
