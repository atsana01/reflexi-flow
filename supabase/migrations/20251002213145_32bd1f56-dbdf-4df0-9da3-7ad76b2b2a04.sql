-- Fix security issues from previous migration

-- 1. Drop the security definer view and just keep the function
DROP VIEW IF EXISTS public.v_client_balances;

-- 2. Add search_path to touch_updated_at function
CREATE OR REPLACE FUNCTION public.touch_updated_at() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END; 
$$;

-- Update client_balances function to query directly without view
CREATE OR REPLACE FUNCTION public.client_balances()
RETURNS TABLE (client_id uuid, total_billed numeric, total_paid numeric, balance_due numeric)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    c.id as client_id,
    COALESCE(SUM(s.bill_amount), 0) as total_billed,
    COALESCE((SELECT SUM(p.amount) FROM public.payments p
              WHERE p.client_id = c.id AND p.account_id = auth.uid()), 0) as total_paid,
    COALESCE(SUM(s.bill_amount), 0) - COALESCE((SELECT SUM(p.amount) FROM public.payments p
              WHERE p.client_id = c.id AND p.account_id = auth.uid()), 0) as balance_due
  FROM public.clients c
  LEFT JOIN public.sessions s ON s.client_id = c.id AND s.account_id = auth.uid()
  WHERE c.account_id = auth.uid()
  GROUP BY c.id;
$$;