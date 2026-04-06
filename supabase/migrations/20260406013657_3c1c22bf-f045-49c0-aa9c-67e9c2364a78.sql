
-- Create utility_periods table
CREATE TABLE public.utility_periods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  year integer NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.utility_periods ENABLE ROW LEVEL SECURITY;

-- RLS: owner can manage via property ownership
CREATE POLICY "Owners can view own utility_periods" ON public.utility_periods
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties WHERE properties.id = utility_periods.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Owners can insert own utility_periods" ON public.utility_periods
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.properties WHERE properties.id = utility_periods.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Owners can update own utility_periods" ON public.utility_periods
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties WHERE properties.id = utility_periods.property_id AND properties.user_id = auth.uid()));

CREATE POLICY "Owners can delete own utility_periods" ON public.utility_periods
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties WHERE properties.id = utility_periods.property_id AND properties.user_id = auth.uid()));

-- Create utility_costs table
CREATE TABLE public.utility_costs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_id uuid NOT NULL REFERENCES public.utility_periods(id) ON DELETE CASCADE,
  category text NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  distribution_key text NOT NULL DEFAULT 'per_unit',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.utility_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own utility_costs" ON public.utility_costs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.utility_periods p
    JOIN public.properties pr ON pr.id = p.property_id
    WHERE p.id = utility_costs.period_id AND pr.user_id = auth.uid()
  ));

CREATE POLICY "Owners can insert own utility_costs" ON public.utility_costs
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.utility_periods p
    JOIN public.properties pr ON pr.id = p.property_id
    WHERE p.id = utility_costs.period_id AND pr.user_id = auth.uid()
  ));

CREATE POLICY "Owners can update own utility_costs" ON public.utility_costs
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.utility_periods p
    JOIN public.properties pr ON pr.id = p.property_id
    WHERE p.id = utility_costs.period_id AND pr.user_id = auth.uid()
  ));

CREATE POLICY "Owners can delete own utility_costs" ON public.utility_costs
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.utility_periods p
    JOIN public.properties pr ON pr.id = p.property_id
    WHERE p.id = utility_costs.period_id AND pr.user_id = auth.uid()
  ));

-- Create utility_results table
CREATE TABLE public.utility_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_id uuid NOT NULL REFERENCES public.utility_periods(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  tenant_name text NOT NULL DEFAULT '',
  unit_id text NOT NULL DEFAULT '',
  sqm numeric NOT NULL DEFAULT 0,
  advance_paid numeric NOT NULL DEFAULT 0,
  allocated_costs numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.utility_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own utility_results" ON public.utility_results
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.utility_periods p
    JOIN public.properties pr ON pr.id = p.property_id
    WHERE p.id = utility_results.period_id AND pr.user_id = auth.uid()
  ));

CREATE POLICY "Owners can insert own utility_results" ON public.utility_results
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.utility_periods p
    JOIN public.properties pr ON pr.id = p.property_id
    WHERE p.id = utility_results.period_id AND pr.user_id = auth.uid()
  ));

CREATE POLICY "Owners can update own utility_results" ON public.utility_results
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.utility_periods p
    JOIN public.properties pr ON pr.id = p.property_id
    WHERE p.id = utility_results.period_id AND pr.user_id = auth.uid()
  ));

CREATE POLICY "Owners can delete own utility_results" ON public.utility_results
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.utility_periods p
    JOIN public.properties pr ON pr.id = p.property_id
    WHERE p.id = utility_results.period_id AND pr.user_id = auth.uid()
  ));
