CREATE TABLE public.rent_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  unit_id text NOT NULL,
  tenant_name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  paid_at timestamptz,
  status text NOT NULL DEFAULT 'ausstehend',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rent_payments" ON public.rent_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rent_payments" ON public.rent_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rent_payments" ON public.rent_payments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rent_payments" ON public.rent_payments
  FOR DELETE USING (auth.uid() = user_id);