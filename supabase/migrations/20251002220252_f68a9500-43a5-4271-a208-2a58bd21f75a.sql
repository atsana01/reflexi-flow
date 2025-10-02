-- Create allowed emails table
CREATE TABLE IF NOT EXISTS public.allowed_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- Only admins can view allowed emails (for now, readable by authenticated users)
CREATE POLICY "Allowed emails are viewable by authenticated users"
ON public.allowed_emails
FOR SELECT
TO authenticated
USING (true);

-- Insert the two allowed emails
INSERT INTO public.allowed_emails (email) VALUES
  ('atsana01@ucy.ac.cy'),
  ('anastasiareflexology@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Create function to check if email is allowed
CREATE OR REPLACE FUNCTION public.is_email_allowed(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.allowed_emails 
    WHERE LOWER(email) = LOWER(check_email)
  );
$$;

-- Create trigger function to block unauthorized signups
CREATE OR REPLACE FUNCTION public.check_email_allowed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_email_allowed(NEW.email) THEN
    RAISE EXCEPTION 'Η εγγραφή είναι διαθέσιμη μόνο για εξουσιοδοτημένους χρήστες.'
      USING HINT = 'unauthorized_email';
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users (signup validation)
DROP TRIGGER IF EXISTS validate_email_on_signup ON auth.users;
CREATE TRIGGER validate_email_on_signup
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_email_allowed();