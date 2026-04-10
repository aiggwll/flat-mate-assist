-- Add reminder tracking column to rent_payments
ALTER TABLE public.rent_payments
ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz DEFAULT NULL;

-- Create payment reminders log table
CREATE TABLE public.payment_reminders_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  tenant_id text NOT NULL,
  property_id text,
  due_date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  email_sent_to text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  payment_id uuid REFERENCES public.rent_payments(id) ON DELETE SET NULL,
  error_message text
);

-- Enable RLS
ALTER TABLE public.payment_reminders_log ENABLE ROW LEVEL SECURITY;

-- Owners can view logs for their own payments
CREATE POLICY "Owners can view own reminder logs"
ON public.payment_reminders_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rent_payments rp
    WHERE rp.id = payment_reminders_log.payment_id
    AND rp.user_id = auth.uid()
  )
);

-- Service role can insert logs (used by edge function)
CREATE POLICY "Service role can insert reminder logs"
ON public.payment_reminders_log
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Service role can read all logs
CREATE POLICY "Service role can read reminder logs"
ON public.payment_reminders_log
FOR SELECT
USING (auth.role() = 'service_role');