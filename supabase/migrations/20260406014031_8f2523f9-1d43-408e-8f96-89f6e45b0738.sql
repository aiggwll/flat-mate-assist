
-- Create tax_documents table
CREATE TABLE public.tax_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  filename text NOT NULL DEFAULT '',
  file_url text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  document_date date,
  description text NOT NULL DEFAULT '',
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tax_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tax_documents" ON public.tax_documents
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax_documents" ON public.tax_documents
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax_documents" ON public.tax_documents
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tax_documents" ON public.tax_documents
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('tax-documents', 'tax-documents', true);

-- Storage RLS policies
CREATE POLICY "Users can upload own tax files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tax-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own tax files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'tax-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own tax files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'tax-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
