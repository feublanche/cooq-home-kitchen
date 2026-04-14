
CREATE TABLE public.cook_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cook_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'general',
  read boolean NOT NULL DEFAULT false,
  related_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cook_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cook reads own notifications"
ON public.cook_notifications FOR SELECT
TO authenticated
USING (cook_id IN (SELECT id FROM public.cooks WHERE user_id = auth.uid()));

CREATE POLICY "Cook updates own notifications"
ON public.cook_notifications FOR UPDATE
TO authenticated
USING (cook_id IN (SELECT id FROM public.cooks WHERE user_id = auth.uid()));

CREATE POLICY "Operator manages all notifications"
ON public.cook_notifications FOR ALL
TO authenticated
USING (((auth.jwt() -> 'app_metadata') ->> 'role') = 'operator');

CREATE POLICY "Service role inserts notifications"
ON public.cook_notifications FOR INSERT
TO authenticated
WITH CHECK (cook_id IN (SELECT id FROM public.cooks WHERE user_id = auth.uid()));

CREATE INDEX idx_cook_notifications_cook_id ON public.cook_notifications(cook_id);
CREATE INDEX idx_cook_notifications_read ON public.cook_notifications(cook_id, read);
