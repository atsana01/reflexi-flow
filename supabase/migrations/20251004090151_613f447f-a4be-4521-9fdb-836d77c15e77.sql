-- Phase 1.1: Activate Role System by assigning 'owner' role to existing users

-- Assign 'owner' role to all existing users who don't have a role yet
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'owner'::app_role 
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- Add helpful comment
COMMENT ON TABLE public.user_roles IS 'Stores user role assignments. All new users automatically get owner role via handle_new_user trigger. Existing users are backfilled with owner role.';