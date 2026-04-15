
ALTER TABLE public.cook_documents DROP CONSTRAINT valid_doc_type;
ALTER TABLE public.cook_documents ADD CONSTRAINT valid_doc_type CHECK (document_type = ANY (ARRAY['emirates_id'::text, 'emirates_id_front'::text, 'emirates_id_back'::text, 'health_card'::text, 'certification'::text]));
UPDATE public.cook_documents SET document_type = 'emirates_id_front' WHERE document_type = 'emirates_id';
