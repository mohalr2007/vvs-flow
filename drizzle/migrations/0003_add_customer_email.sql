ALTER TABLE public.jobs ADD COLUMN email text NOT NULL DEFAULT '';
ALTER TABLE public.waitlist_entries ADD COLUMN email text NOT NULL DEFAULT '';
ALTER TABLE public.projects ADD COLUMN email text NOT NULL DEFAULT '';