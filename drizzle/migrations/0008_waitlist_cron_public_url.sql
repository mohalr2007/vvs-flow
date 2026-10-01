-- lovable-cron-fallback-reviewed: the scheduler must reach the PUBLIC published site.
-- 'project--<id>.lovable.app' serves the editor preview shell (the API route is not
-- registered there), so every-minute pings never reached /api/public/cron/offers.
-- cron.schedule replaces the job with the same name, so this re-points it to the
-- published domain; the endpoint stays key-authenticated.
SELECT cron.unschedule('waitlist-offer-cascade');
SELECT cron.schedule(
  'waitlist-offer-cascade',
  '* * * * *',
  $$ SELECT net.http_post(
       url := 'https://pro-flow-ops.lovable.app/api/public/cron/offers',
       headers := jsonb_build_object('Content-Type','application/json','x-cron-key',(SELECT key FROM public.internal_cron_key WHERE id = 1)),
       body := '{}'::jsonb
     ); $$
);
