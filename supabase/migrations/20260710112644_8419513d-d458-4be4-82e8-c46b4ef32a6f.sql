
-- 1) Storage policy: tenants can read files in 'documents' bucket
--    that correspond to a documents row shared with them.
DROP POLICY IF EXISTS "Tenants can read shared documents" ON storage.objects;

CREATE POLICY "Tenants can read shared documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1
    FROM public.documents d
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE d.file_url = storage.objects.name
      AND d.shared_with_tenant = true
      AND p.role = 'tenant'
      AND (
        (d.property_id IS NOT NULL AND p.property_id = d.property_id::text)
        OR EXISTS (
          SELECT 1 FROM public.properties pr
          WHERE pr.id = d.property_id
            AND pr.id::text = p.property_id
        )
      )
  )
);

-- 2) Realtime authorization for public.messages
--    Restrict topic subscriptions on realtime.messages so a user can only
--    subscribe to their own message events.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can receive their own message realtime events" ON realtime.messages;

CREATE POLICY "Users can receive their own message realtime events"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'messages-changes'
  AND EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.sender_id = auth.uid() OR m.receiver_id = auth.uid()
  )
);
