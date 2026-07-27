CREATE TABLE public.user_memories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  fact text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  weight int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, fact)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_memories TO authenticated;
GRANT ALL ON public.user_memories TO service_role;
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own memories" ON public.user_memories FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX user_memories_user_idx ON public.user_memories (user_id, updated_at DESC);
CREATE TRIGGER update_user_memories_updated_at BEFORE UPDATE ON public.user_memories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();