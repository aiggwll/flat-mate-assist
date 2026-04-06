ALTER TABLE public.rent_payments ADD COLUMN cold_rent numeric NOT NULL DEFAULT 0;
ALTER TABLE public.rent_payments ADD COLUMN warm_rent numeric NOT NULL DEFAULT 0;