-- Demo data with real Västerås coordinates so the route-aware slot engine and
-- calendar show genuine drive times immediately after a demo reset.
-- Same seed as 0000, with lat/lng added to jobs and address/lat/lng to projects.
CREATE OR REPLACE FUNCTION public._seed_demo()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE d timestamptz := (date_trunc('day', now() AT TIME ZONE 'Europe/Stockholm')) AT TIME ZONE 'Europe/Stockholm';
BEGIN
  DELETE FROM public.offers WHERE true; DELETE FROM public.waitlist_entries WHERE true; DELETE FROM public.jobs WHERE true;
  DELETE FROM public.projects WHERE true; DELETE FROM public.leads WHERE true; DELETE FROM public.rot_records WHERE true; DELETE FROM public.inbox_messages WHERE true;
  DELETE FROM public.settings WHERE true;
  INSERT INTO public.settings (id) VALUES (1);

  INSERT INTO public.jobs (ref, customer_name, phone, address, zone, title, description, status, urgency, confidence, duration_min, value, scheduled_at, access_status, lat, lng) VALUES
  ('JOB-2048','Anna Lindberg','070 123 45 67','Källgatan 12, 722 11 Västerås','723','Kitchen sink leak','Water collecting under the kitchen cabinet when the tap is used.','confirmed','High',94,90,2450, d + interval '8 hours 30 minutes', NULL, 59.6087, 16.5436),
  ('JOB-2049','Erik Sjöberg','070 222 33 44','Vasagatan 4, 724 60 Västerås','724','Faucet repair','Bathroom tap drips continuously and the handle feels loose.','access_confirmed','Normal',91,60,1750, d + interval '10 hours 30 minutes', 'Yes, I''ll be home', 59.6105, 16.5482),
  ('JOB-2050','Sara Nilsson','073 555 12 34','Hagagatan 9, 726 31 Västerås','726','Boiler service','Annual boiler inspection and pressure check.','confirmed','Normal',88,90,3200, d + interval '13 hours', NULL, 59.6152, 16.5563),
  ('JOB-2052','Jonas Wik','070 987 65 43','Skiljebovägen 2, 723 40 Västerås','723','Toilet cistern replacement','Cistern keeps running after flush.','cancelled','Normal',90,90,2600, d + interval '14 hours 30 minutes', NULL, 59.6280, 16.4890),
  ('JOB-2051','Oskar Berg','076 111 22 33','Stenby 5, 722 22 Västerås','722','Unknown pressure noise','A pulsing sound comes from the wall whenever the upstairs shower is running.','needs_assessment','Normal',42,60,0, NULL, NULL, 59.5895, 16.5065),
  ('JOB-2053','Lena Holm','072 444 55 66','Bäckby Centrum 8, 725 97 Västerås','725','Shower mixer replacement','Shower mixer is stiff and temperature jumps.','new','Normal',87,75,2900, NULL, NULL, 59.5955, 16.5230),
  ('JOB-2054','Per Andersson','070 777 88 99','Råbyvägen 20, 724 70 Västerås','724','Radiator valve','Radiator in bedroom will not heat up.','confirmed','Normal',92,60,1650, d + interval '1 day 9 hours', NULL, 59.6000, 16.5755);

  INSERT INTO public.waitlist_entries (customer_name, phone, title, zone, duration_min, flexibility, urgency, value, created_at) VALUES
  ('Maja Lindqvist','070 300 10 10','Kitchen leak','723',90,'Flexible','High',2400, now() - interval '5 days'),
  ('Erik Holm','070 300 20 20','Toilet repair','724',60,'Afternoons','Normal',1800, now() - interval '7 days'),
  ('Sara Ek','070 300 30 30','Faucet repair','726',60,'Any weekday','Normal',1500, now() - interval '3 days'),
  ('Johan Strand','070 300 40 40','Water heater check','728',120,'Fixed dates','Low',3100, now() - interval '1 day');

  INSERT INTO public.projects (ref, title, customer_name, status, budget, description, address, lat, lng) VALUES
  ('P-301','Bathroom renovation','Familjen Åberg','site_visit_requested','80–120k SEK','Full bathroom renovation including floor heating.','Vasagatan 32, 724 60 Västerås', 59.6128, 16.5555),
  ('P-302','Kitchen installation','Maria Wallin','owner_review','35–50k SEK','New kitchen with dishwasher and island sink.','Kopparlunden 4, 721 30 Västerås', 59.6249, 16.5672),
  ('P-303','Boiler replacement','BRF Eken','project_approved','145k SEK','Replace central boiler for 24 apartments.','Hamngatan 15, 722 12 Västerås', 59.6062, 16.5392);

  INSERT INTO public.leads (name, work, stage, value) VALUES
  ('Linn Persson','Outdoor tap','New',2200),
  ('BRF Solrosen','Pipe inspection','Qualified',18000),
  ('David Lund','Shower mixer','Held',3400),
  ('Elin Fors','Radiator noise','Abandoned',2800);

  INSERT INTO public.rot_records (customer, work, labor, materials, status) VALUES
  ('Karin Öst','Bathroom repair',4200,1450,'Ready'),
  ('Jan Vik','Boiler service',2800,620,'Review'),
  ('Eva Palm','Pipe replacement',6400,2100,'Ready');
END $$;
