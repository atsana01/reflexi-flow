-- Add GDPR consent fields to clients table
ALTER TABLE public.clients
ADD COLUMN gdpr_consent boolean DEFAULT false NOT NULL,
ADD COLUMN consent_date timestamp with time zone;

-- Add comment for documentation
COMMENT ON COLUMN public.clients.gdpr_consent IS 'GDPR consent for processing personal data';
COMMENT ON COLUMN public.clients.consent_date IS 'Timestamp when GDPR consent was given';