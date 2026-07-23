
CREATE TABLE public.web_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL DEFAULT '',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.web_messages TO authenticated;
GRANT ALL ON public.web_messages TO service_role;
ALTER TABLE public.web_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rows" ON public.web_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX web_messages_user_created ON public.web_messages (user_id, created_at);
