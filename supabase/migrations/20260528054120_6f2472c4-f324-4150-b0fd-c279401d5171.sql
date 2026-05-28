ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';

UPDATE public.properties
SET name = address
WHERE name = '';

COMMENT ON COLUMN public.properties.name IS 'Display name for the property shown in the app and required in property forms.';