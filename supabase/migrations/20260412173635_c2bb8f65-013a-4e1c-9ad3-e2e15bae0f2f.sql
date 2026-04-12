
-- 1. Allow cooks to insert their own profile row during signup
CREATE POLICY "Cook inserts own profile"
ON public.cooks FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- 2. Add description and photo_urls columns to cook_menus
ALTER TABLE public.cook_menus ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.cook_menus ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}'::text[];

-- 3. Create cook_documents table
CREATE TABLE public.cook_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cook_id uuid NOT NULL REFERENCES public.cooks(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_url text NOT NULL,
  status text NOT NULL DEFAULT 'uploaded',
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  CONSTRAINT valid_doc_type CHECK (document_type IN ('emirates_id', 'health_card', 'certification'))
);

ALTER TABLE public.cook_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cook manages own documents"
ON public.cook_documents FOR ALL TO authenticated
USING (cook_id IN (SELECT id FROM public.cooks WHERE user_id = auth.uid()))
WITH CHECK (cook_id IN (SELECT id FROM public.cooks WHERE user_id = auth.uid()));

CREATE POLICY "Operator reads all documents"
ON public.cook_documents FOR SELECT TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'operator');

CREATE POLICY "Operator updates documents"
ON public.cook_documents FOR UPDATE TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'operator');

-- 4. cook-documents storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('cook-documents', 'cook-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Cook uploads own docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cook-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Cook views own docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'cook-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Operator views all docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'cook-documents' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'operator');

-- 5. cook-photos storage bucket (public for profile/menu images)
INSERT INTO storage.buckets (id, name, public) VALUES ('cook-photos', 'cook-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Cook uploads own photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cook-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Cook updates own photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'cook-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public views cook photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'cook-photos');
