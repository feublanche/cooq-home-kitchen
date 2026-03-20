
CREATE TABLE public.cook_blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cook_id uuid REFERENCES public.cooks(id) ON DELETE CASCADE NOT NULL,
  blocked_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(cook_id, blocked_date)
);

ALTER TABLE public.cook_blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cook manages own blocked dates" ON public.cook_blocked_dates
  FOR ALL TO public
  USING (cook_id IN (SELECT id FROM cooks WHERE user_id = auth.uid()));

CREATE POLICY "Public reads blocked dates" ON public.cook_blocked_dates
  FOR SELECT TO public
  USING (true);
