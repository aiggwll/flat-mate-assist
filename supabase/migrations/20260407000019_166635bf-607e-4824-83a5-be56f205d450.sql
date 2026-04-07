
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS shared_with_tenant boolean NOT NULL DEFAULT false;

CREATE POLICY "Users can update own documents"
ON public.documents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tenants can view shared documents"
ON public.documents
FOR SELECT
TO authenticated
USING (
  shared_with_tenant = true
  AND property_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'tenant'
    AND profiles.property_id = documents.property_id::text
  )
);
