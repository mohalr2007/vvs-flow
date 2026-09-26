
CREATE TYPE public.app_role AS ENUM ('owner');
CREATE TYPE public.job_status AS ENUM ('new','qualified','held','confirmed','access_confirmed','in_progress','completed','cancelled','expired','waitlisted','needs_assessment');
CREATE TYPE public.project_status AS ENUM ('project_request','site_visit_requested','site_visit_scheduled','owner_review','project_approved','scheduled','in_progress','completed');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE TABLE public.settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  business_name text NOT NULL DEFAULT 'Ekström VVS',
  owner_name text NOT NULL DEFAULT 'Mats Ekström',
  service_area text NOT NULL DEFAULT 'Västerås',
  emergency_buffer_min int NOT NULL DEFAULT 90,
  work_start_hour int NOT NULL DEFAULT 8,
  work_end_hour int NOT NULL DEFAULT 17,
  hourly_rate int NOT NULL DEFAULT 850,
  clock_offset_minutes int NOT NULL DEFAULT 0
);

CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref text NOT NULL UNIQUE DEFAULT ('JOB-' || substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  customer_name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  zone text NOT NULL DEFAULT '',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status public.job_status NOT NULL DEFAULT 'new',
  urgency text NOT NULL DEFAULT 'Normal',
  confidence int NOT NULL DEFAULT 0,
  duration_min int NOT NULL DEFAULT 60,
  value int NOT NULL DEFAULT 0,
  scheduled_at timestamptz,
  is_emergency boolean NOT NULL DEFAULT false,
  site_visit boolean NOT NULL DEFAULT false,
  missing_fields text[] NOT NULL DEFAULT '{}',
  access_status text,
  access_token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text,'-',''),
  photo_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.waitlist_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  title text NOT NULL,
  zone text NOT NULL,
  duration_min int NOT NULL DEFAULT 60,
  flexibility text NOT NULL DEFAULT 'Flexible',
  urgency text NOT NULL DEFAULT 'Normal',
  value int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'waiting',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text,'-',''),
  waitlist_id uuid NOT NULL REFERENCES public.waitlist_entries(id) ON DELETE CASCADE,
  source_job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  slot_start timestamptz NOT NULL,
  duration_min int NOT NULL,
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  score int NOT NULL DEFAULT 0,
  breakdown jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref text NOT NULL UNIQUE DEFAULT ('P-' || substr(replace(gen_random_uuid()::text,'-',''),1,5)),
  title text NOT NULL,
  customer_name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  status public.project_status NOT NULL DEFAULT 'project_request',
  budget text NOT NULL DEFAULT 'To be assessed',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  work text NOT NULL,
  stage text NOT NULL DEFAULT 'New',
  value int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.rot_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer text NOT NULL,
  work text NOT NULL,
  labor int NOT NULL DEFAULT 0,
  materials int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Review',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inbox_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body text NOT NULL,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings, public.jobs, public.waitlist_entries, public.offers, public.projects, public.leads, public.rot_records, public.inbox_messages TO authenticated;
GRANT ALL ON public.settings, public.jobs, public.waitlist_entries, public.offers, public.projects, public.leads, public.rot_records, public.inbox_messages TO service_role;

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rot_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner full access" ON public.settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));
CREATE POLICY "owner full access" ON public.jobs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));
CREATE POLICY "owner full access" ON public.waitlist_entries FOR ALL TO authenticated USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));
CREATE POLICY "owner full access" ON public.offers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));
CREATE POLICY "owner full access" ON public.projects FOR ALL TO authenticated USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));
CREATE POLICY "owner full access" ON public.leads FOR ALL TO authenticated USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));
CREATE POLICY "owner full access" ON public.rot_records FOR ALL TO authenticated USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));
CREATE POLICY "owner full access" ON public.inbox_messages FOR ALL TO authenticated USING (public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'owner'));

CREATE OR REPLACE FUNCTION public._seed_demo()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE d timestamptz := (date_trunc('day', now() AT TIME ZONE 'Europe/Stockholm')) AT TIME ZONE 'Europe/Stockholm';
BEGIN
  DELETE FROM public.offers WHERE true; DELETE FROM public.waitlist_entries WHERE true; DELETE FROM public.jobs WHERE true;
  DELETE FROM public.projects WHERE true; DELETE FROM public.leads WHERE true; DELETE FROM public.rot_records WHERE true; DELETE FROM public.inbox_messages WHERE true;
  DELETE FROM public.settings WHERE true;
  INSERT INTO public.settings (id) VALUES (1);

  INSERT INTO public.jobs (ref, customer_name, phone, address, zone, title, description, status, urgency, confidence, duration_min, value, scheduled_at, access_status) VALUES
  ('JOB-2048','Anna Lindberg','070 123 45 67','Källgatan 12, 722 11 Västerås','723','Kitchen sink leak','Water collecting under the kitchen cabinet when the tap is used.','confirmed','High',94,90,2450, d + interval '8 hours 30 minutes', NULL),
  ('JOB-2049','Erik Sjöberg','070 222 33 44','Vasagatan 4, 724 60 Västerås','724','Faucet repair','Bathroom tap drips continuously and the handle feels loose.','access_confirmed','Normal',91,60,1750, d + interval '10 hours 30 minutes', 'Yes, I''ll be home'),
  ('JOB-2050','Sara Nilsson','073 555 12 34','Hagagatan 9, 726 31 Västerås','726','Boiler service','Annual boiler inspection and pressure check.','confirmed','Normal',88,90,3200, d + interval '13 hours', NULL),
  ('JOB-2052','Jonas Wik','070 987 65 43','Skiljebovägen 2, 723 40 Västerås','723','Toilet cistern replacement','Cistern keeps running after flush.','cancelled','Normal',90,90,2600, d + interval '14 hours 30 minutes', NULL),
  ('JOB-2051','Oskar Berg','076 111 22 33','Stenby 5, 722 22 Västerås','722','Unknown pressure noise','A pulsing sound comes from the wall whenever the upstairs shower is running.','needs_assessment','Normal',42,60,0, NULL, NULL),
  ('JOB-2053','Lena Holm','072 444 55 66','Bäckby Centrum 8, 725 97 Västerås','725','Shower mixer replacement','Shower mixer is stiff and temperature jumps.','new','Normal',87,75,2900, NULL, NULL),
  ('JOB-2054','Per Andersson','070 777 88 99','Råbyvägen 20, 724 70 Västerås','724','Radiator valve','Radiator in bedroom will not heat up.','confirmed','Normal',92,60,1650, d + interval '1 day 9 hours', NULL);

  INSERT INTO public.waitlist_entries (customer_name, phone, title, zone, duration_min, flexibility, urgency, value, created_at) VALUES
  ('Maja Lindqvist','070 300 10 10','Kitchen leak','723',90,'Flexible','High',2400, now() - interval '5 days'),
  ('Erik Holm','070 300 20 20','Toilet repair','724',60,'Afternoons','Normal',1800, now() - interval '7 days'),
  ('Sara Ek','070 300 30 30','Faucet repair','726',60,'Any weekday','Normal',1500, now() - interval '3 days'),
  ('Johan Strand','070 300 40 40','Water heater check','728',120,'Fixed dates','Low',3100, now() - interval '1 day');

  INSERT INTO public.projects (ref, title, customer_name, status, budget, description) VALUES
  ('P-301','Bathroom renovation','Familjen Åberg','site_visit_requested','80–120k SEK','Full bathroom renovation including floor heating.'),
  ('P-302','Kitchen installation','Maria Wallin','owner_review','35–50k SEK','New kitchen with dishwasher and island sink.'),
  ('P-303','Boiler replacement','BRF Eken','project_approved','145k SEK','Replace central boiler for 24 apartments.');

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
REVOKE ALL ON FUNCTION public._seed_demo() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._seed_demo() TO service_role;

CREATE OR REPLACE FUNCTION public.reset_demo()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  PERFORM public._seed_demo();
END $$;
REVOKE ALL ON FUNCTION public.reset_demo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_demo() TO authenticated;

CREATE POLICY "owner reads job photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'job-photos' AND public.has_role(auth.uid(), 'owner'));
