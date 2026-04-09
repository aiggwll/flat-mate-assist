
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  tenant_name TEXT NOT NULL DEFAULT '',
  property_id UUID NOT NULL,
  unit_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by UUID NOT NULL,
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  invite_link TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own invitations"
  ON public.invitations FOR SELECT
  TO authenticated
  USING (auth.uid() = invited_by);

CREATE POLICY "Owners can create invitations"
  ON public.invitations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = invited_by);

CREATE POLICY "Owners can update own invitations"
  ON public.invitations FOR UPDATE
  TO authenticated
  USING (auth.uid() = invited_by);

CREATE INDEX idx_invitations_invited_by ON public.invitations (invited_by);
CREATE INDEX idx_invitations_email ON public.invitations (email);
