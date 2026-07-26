
CREATE TABLE public.telegram_config (
  id smallint PRIMARY KEY DEFAULT 1,
  allowed_user_id bigint,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO public.telegram_config (id) VALUES (1) ON CONFLICT DO NOTHING;
GRANT ALL ON public.telegram_config TO service_role;
ALTER TABLE public.telegram_config ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.telegram_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL DEFAULT '',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX telegram_messages_chat_created_idx ON public.telegram_messages (chat_id, created_at);
GRANT ALL ON public.telegram_messages TO service_role;
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;
