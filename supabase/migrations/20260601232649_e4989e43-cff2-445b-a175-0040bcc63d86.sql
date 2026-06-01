
-- 1. Profiles: restrict SELECT to self + related users (property/messages counterparties)
CREATE OR REPLACE FUNCTION public.can_view_profile(_target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() = _target
    OR EXISTS (
      SELECT 1 FROM public.messages m
      WHERE (m.sender_id = auth.uid() AND m.receiver_id = _target)
         OR (m.receiver_id = auth.uid() AND m.sender_id = _target)
    )
    -- Owner viewing tenant on one of their properties
    OR EXISTS (
      SELECT 1
      FROM public.profiles tgt
      JOIN public.properties p ON p.id::text = tgt.property_id
      WHERE tgt.user_id = _target
        AND p.user_id = auth.uid()
    )
    -- Tenant viewing the owner of their property
    OR EXISTS (
      SELECT 1
      FROM public.profiles me
      JOIN public.properties p ON p.id::text = me.property_id
      WHERE me.user_id = auth.uid()
        AND p.user_id = _target
    )
$$;

REVOKE EXECUTE ON FUNCTION public.can_view_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_profile(uuid) TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
CREATE POLICY "Users can read related profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.can_view_profile(user_id));

-- 2. Profiles: prevent role escalation via trigger
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Changing role is not allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_role_change ON public.profiles;
CREATE TRIGGER prevent_profile_role_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_role_change();

-- 3. payment_reminders_log: drop redundant service-role SELECT (service_role bypasses RLS anyway)
DROP POLICY IF EXISTS "Service role can read reminder logs" ON public.payment_reminders_log;

-- 4. Pin search_path & lock down EXECUTE on public SECURITY DEFINER functions
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;

-- 5. Make tax-documents bucket private and add owner-scoped storage policies
UPDATE storage.buckets SET public = false WHERE id = 'tax-documents';

DROP POLICY IF EXISTS "Owners can read own tax-documents" ON storage.objects;
CREATE POLICY "Owners can read own tax-documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'tax-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Owners can upload own tax-documents" ON storage.objects;
CREATE POLICY "Owners can upload own tax-documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tax-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Owners can delete own tax-documents" ON storage.objects;
CREATE POLICY "Owners can delete own tax-documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'tax-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
