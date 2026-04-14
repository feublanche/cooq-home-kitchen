
-- Fix cook_documents RLS: drop the ALL policy and create explicit per-operation policies
DROP POLICY IF EXISTS "Cook manages own documents" ON public.cook_documents;

CREATE POLICY "Cook selects own documents"
ON public.cook_documents
FOR SELECT
TO authenticated
USING (cook_id IN (SELECT id FROM public.cooks WHERE user_id = auth.uid()));

CREATE POLICY "Cook inserts own documents"
ON public.cook_documents
FOR INSERT
TO authenticated
WITH CHECK (cook_id IN (SELECT id FROM public.cooks WHERE user_id = auth.uid()));

CREATE POLICY "Cook updates own documents"
ON public.cook_documents
FOR UPDATE
TO authenticated
USING (cook_id IN (SELECT id FROM public.cooks WHERE user_id = auth.uid()));

CREATE POLICY "Cook deletes own documents"
ON public.cook_documents
FOR DELETE
TO authenticated
USING (cook_id IN (SELECT id FROM public.cooks WHERE user_id = auth.uid()));

-- Also fix storage policies for cook-documents bucket
-- Allow cooks to upload to their folder in cook-documents bucket
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Cooks upload own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Cooks read own documents" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Cooks upload own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cook-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.cooks WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Cooks read own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'cook-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.cooks WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Cooks overwrite own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cook-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.cooks WHERE user_id = auth.uid()
  )
);
