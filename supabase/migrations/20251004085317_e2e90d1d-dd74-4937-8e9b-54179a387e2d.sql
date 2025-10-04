-- Phase 1: Critical Security Fixes - Staff Access Control & Role Management

-- 1. Create staff_accounts table to properly map staff users to their employer accounts
CREATE TABLE IF NOT EXISTS public.staff_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id, account_id)
);

-- Enable RLS on staff_accounts
ALTER TABLE public.staff_accounts ENABLE ROW LEVEL SECURITY;

-- Only account owners can manage their staff
CREATE POLICY "Account owners can manage their staff"
ON public.staff_accounts
FOR ALL
TO authenticated
USING (account_id = auth.uid())
WITH CHECK (account_id = auth.uid());

-- Staff can view their own assignments
CREATE POLICY "Staff can view their assignments"
ON public.staff_accounts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. Fix the critical RLS flaw on clients table - staff must belong to the account
DROP POLICY IF EXISTS "Account owners and staff can view clients" ON public.clients;

CREATE POLICY "Account owners and staff can view clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  -- Owner of the account
  account_id = auth.uid() 
  OR 
  -- Staff member assigned to this account
  (public.has_role(auth.uid(), 'staff') AND account_id IN (
    SELECT account_id FROM public.staff_accounts WHERE user_id = auth.uid()
  ))
  OR
  -- User with 'owner' role assigned to this account
  (public.has_role(auth.uid(), 'owner') AND account_id IN (
    SELECT account_id FROM public.staff_accounts WHERE user_id = auth.uid()
  ))
);

-- 3. Add proper RLS policies to user_roles for role management
DROP POLICY IF EXISTS "user_roles readable by owner" ON public.user_roles;

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Account owners can assign roles to their staff
CREATE POLICY "Account owners can assign roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Can only assign roles to staff members of accounts they own
  EXISTS (
    SELECT 1 FROM public.staff_accounts sa
    WHERE sa.user_id = user_roles.user_id
    AND sa.account_id = auth.uid()
  )
);

-- Account owners can update roles of their staff
CREATE POLICY "Account owners can update staff roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.staff_accounts sa
    WHERE sa.user_id = user_roles.user_id
    AND sa.account_id = auth.uid()
  )
);

-- Account owners can remove roles from their staff
CREATE POLICY "Account owners can delete staff roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.staff_accounts sa
    WHERE sa.user_id = user_roles.user_id
    AND sa.account_id = auth.uid()
  )
);

-- 4. Update handle_new_user trigger to assign default 'owner' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  
  -- Assign default 'owner' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'owner');
  
  RETURN new;
END;
$$;

-- 5. Align payments, sessions, appointments, packages RLS for staff access
-- PAYMENTS: Staff can view payments for their assigned accounts
DROP POLICY IF EXISTS "payments by account" ON public.payments;

CREATE POLICY "Account owners can manage payments"
ON public.payments
FOR ALL
TO authenticated
USING (account_id = auth.uid())
WITH CHECK (account_id = auth.uid());

CREATE POLICY "Staff can view payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'staff') AND account_id IN (
    SELECT account_id FROM public.staff_accounts WHERE user_id = auth.uid()
  )
);

-- SESSIONS: Staff can view sessions for their assigned accounts
DROP POLICY IF EXISTS "sessions by account" ON public.sessions;

CREATE POLICY "Account owners can manage sessions"
ON public.sessions
FOR ALL
TO authenticated
USING (account_id = auth.uid())
WITH CHECK (account_id = auth.uid());

CREATE POLICY "Staff can view sessions"
ON public.sessions
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'staff') AND account_id IN (
    SELECT account_id FROM public.staff_accounts WHERE user_id = auth.uid()
  )
);

-- APPOINTMENTS: Staff can view appointments for their assigned accounts
DROP POLICY IF EXISTS "appointments by account" ON public.appointments;

CREATE POLICY "Account owners can manage appointments"
ON public.appointments
FOR ALL
TO authenticated
USING (account_id = auth.uid())
WITH CHECK (account_id = auth.uid());

CREATE POLICY "Staff can view appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'staff') AND account_id IN (
    SELECT account_id FROM public.staff_accounts WHERE user_id = auth.uid()
  )
);

-- PACKAGES: Staff can view packages for their assigned accounts
DROP POLICY IF EXISTS "packages by account" ON public.packages;

CREATE POLICY "Account owners can manage packages"
ON public.packages
FOR ALL
TO authenticated
USING (account_id = auth.uid())
WITH CHECK (account_id = auth.uid());

CREATE POLICY "Staff can view packages"
ON public.packages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'staff') AND account_id IN (
    SELECT account_id FROM public.staff_accounts WHERE user_id = auth.uid()
  )
);

-- 6. Add audit logging comments
COMMENT ON TABLE public.staff_accounts IS 'Maps staff users to employer accounts for proper multi-tenant access control. All assignments are auditable.';
COMMENT ON TABLE public.user_roles IS 'Stores user role assignments. Only account owners can assign roles to their staff members.';