ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS setup_wizard_complete boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS gender text;