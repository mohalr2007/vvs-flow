-- lovable-cron-fallback-reviewed: unanswered 30-min waitlist offers must pass to the next customer within ~1 minute even when nobody has the app open
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE TABLE IF NOT EXISTS public.internal_cron_key (id int PRIMARY KEY DEFAULT 1, key text NOT NULL DEFAULT encode(gen_random_bytes(32),'hex'));
GRANT ALL ON public.internal_cron_key TO service_role;
ALTER TABLE public.internal_cron_key ENABLE ROW LEVEL SECURITY;
INSERT INTO public.internal_cron_key (id) VALUES (1) ON CONFLICT DO NOTHING;
SELECT cron.schedule(
  'waitlist-offer-cascade',
  '* * * * *',
  $$ SELECT net.http_post(
       url := 'https://project--b9506bcd-256a-4188-834f-9981db88d72f.lovable.app/api/public/cron/offers',
       headers := jsonb_build_object('Content-Type','application/json','x-cron-key',(SELECT key FROM public.internal_cron_key WHERE id = 1)),
       body := '{}'::jsonb
     ); $$
);