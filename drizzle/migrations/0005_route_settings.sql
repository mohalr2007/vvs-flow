ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS route_buffer_min integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS day_start_mode text NOT NULL DEFAULT 'business',
  ADD COLUMN IF NOT EXISTS day_end_mode text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS home_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS home_lat double precision,
  ADD COLUMN IF NOT EXISTS home_lng double precision,
  ADD COLUMN IF NOT EXISTS custom_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS custom_lat double precision,
  ADD COLUMN IF NOT EXISTS custom_lng double precision;