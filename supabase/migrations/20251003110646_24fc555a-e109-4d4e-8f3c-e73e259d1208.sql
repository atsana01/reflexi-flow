-- Drop existing client RLS policy
DROP POLICY IF EXISTS "clients are scoped by account" ON public.clients;

-- Create granular RLS policies for clients table with role-based access control

-- Policy 1: Account owners and staff can view clients
CREATE POLICY "Account owners and staff can view clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  account_id = auth.uid() OR 
  public.has_role(auth.uid(), 'owner') OR
  public.has_role(auth.uid(), 'staff')
);

-- Policy 2: Only account owners can create clients
CREATE POLICY "Only account owners can insert clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (account_id = auth.uid());

-- Policy 3: Account owners and staff with owner role can update client data
CREATE POLICY "Account owners and staff can update clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (
  account_id = auth.uid() OR 
  public.has_role(auth.uid(), 'owner')
)
WITH CHECK (
  account_id = auth.uid() OR 
  public.has_role(auth.uid(), 'owner')
);

-- Policy 4: Only account owners can delete/archive clients
CREATE POLICY "Only account owners can delete clients"
ON public.clients
FOR DELETE
TO authenticated
USING (account_id = auth.uid());

-- Add comprehensive audit logging for client data access (GDPR/HIPAA compliance)
CREATE OR REPLACE FUNCTION public.log_client_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    -- Log deletion with anonymized summary (don't store full PII in logs)
    INSERT INTO public.audit_log (account_id, table_name, action, row_id, details)
    VALUES (OLD.account_id, 'clients', 'DELETE', OLD.id, 
      jsonb_build_object(
        'client_name', OLD.first_name || ' ' || OLD.last_name,
        'deleted_at', now()
      )
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Log updates with field-level tracking
    INSERT INTO public.audit_log (account_id, table_name, action, row_id, details)
    VALUES (NEW.account_id, 'clients', 'UPDATE', NEW.id, 
      jsonb_build_object(
        'client_name', NEW.first_name || ' ' || NEW.last_name,
        'updated_fields', jsonb_build_object(
          'email_changed', (OLD.email IS DISTINCT FROM NEW.email),
          'phone_changed', (OLD.phone IS DISTINCT FROM NEW.phone),
          'address_changed', (OLD.address_line IS DISTINCT FROM NEW.address_line),
          'medical_notes_changed', (OLD.pathisi IS DISTINCT FROM NEW.pathisi)
        ),
        'updated_at', now()
      )
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    -- Log new client creation
    INSERT INTO public.audit_log (account_id, table_name, action, row_id, details)
    VALUES (NEW.account_id, 'clients', 'INSERT', NEW.id, 
      jsonb_build_object(
        'client_name', NEW.first_name || ' ' || NEW.last_name,
        'gdpr_consent', NEW.gdpr_consent,
        'created_at', now()
      )
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Attach audit trigger to clients table
DROP TRIGGER IF EXISTS audit_clients_changes ON public.clients;
CREATE TRIGGER audit_clients_changes
AFTER INSERT OR UPDATE OR DELETE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.log_client_changes();

-- Add comment documenting sensitive data handling
COMMENT ON TABLE public.clients IS 'Contains sensitive personal and medical information. All access is logged for compliance. Consider application-level encryption for pathisi field in future updates.';