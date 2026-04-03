
CREATE TABLE public.properties (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  zip_code text NOT NULL,
  year_built integer DEFAULT 0,
  units integer DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own properties"
  ON public.properties FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can insert own properties"
  ON public.properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own properties"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete own properties"
  ON public.properties FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
