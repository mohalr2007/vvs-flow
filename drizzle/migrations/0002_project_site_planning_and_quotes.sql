ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS rest_days integer[] NOT NULL DEFAULT '{0,6}';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS planned_days integer NOT NULL DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS worked_rest_dates date[] NOT NULL DEFAULT '{}';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS quote jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS checklist jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS is_extension boolean NOT NULL DEFAULT false;