-- Lock down telegram tables: server-only access
REVOKE ALL ON public.telegram_config FROM anon, authenticated;
REVOKE ALL ON public.telegram_messages FROM anon, authenticated;

GRANT ALL ON public.telegram_config TO service_role;
GRANT ALL ON public.telegram_messages TO service_role;

ALTER TABLE public.telegram_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.telegram_config FORCE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_messages FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role manages telegram_config" ON public.telegram_config;
CREATE POLICY "service role manages telegram_config"
ON public.telegram_config FOR ALL TO service_role
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service role manages telegram_messages" ON public.telegram_messages;
CREATE POLICY "service role manages telegram_messages"
ON public.telegram_messages FOR ALL TO service_role
USING (true) WITH CHECK (true);