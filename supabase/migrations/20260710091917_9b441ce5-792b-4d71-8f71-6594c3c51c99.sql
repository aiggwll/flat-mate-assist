
CREATE OR REPLACE FUNCTION public.auto_confirm_test_emails()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL
     AND lower(split_part(NEW.email, '@', 2)) = 'dwello-e2e.test'
     AND NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := now();
    NEW.confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_confirm_test_emails_trigger ON auth.users;
CREATE TRIGGER auto_confirm_test_emails_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_test_emails();
