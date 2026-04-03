CREATE TABLE public.cashback_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cashback_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own cashback" ON public.cashback_transactions
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "Tenants can insert own cashback" ON public.cashback_transactions
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);