-- ============================================================
-- LAWTALK — PATCH v3 SQL
-- Run this ENTIRELY in Supabase SQL Editor AFTER Patch v2
-- New fixes:
--   1. lawyer_login RPC — authenticates lawyers via lawyer_auth
--   2. admin_get_lawyers — ensure all document fields returned
--   3. /auth/reset-password — ensure Supabase redirect URL is allowed
-- ============================================================

-- ============================================================
-- FIX 1: LAWYER LOGIN RPC
-- Lawyers don't use Supabase Auth — they have their own
-- lawyer_auth table. This RPC validates the password with
-- pgcrypto and returns lawyer data for the frontend session.
-- ============================================================
CREATE OR REPLACE FUNCTION public.lawyer_login(
  p_email TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_row    lawyer_auth%ROWTYPE;
  v_lawyer_row  lawyers%ROWTYPE;
BEGIN
  -- Find lawyer_auth record
  SELECT * INTO v_auth_row
  FROM public.lawyer_auth
  WHERE LOWER(email) = LOWER(p_email)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No account found with this email.');
  END IF;

  -- Verify password with pgcrypto
  IF v_auth_row.password_hash != crypt(p_password, v_auth_row.password_hash) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid email or password.');
  END IF;

  -- Fetch lawyer record
  SELECT * INTO v_lawyer_row
  FROM public.lawyers
  WHERE id = v_auth_row.lawyer_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lawyer profile not found. Contact support.');
  END IF;

  -- Update last_login
  UPDATE public.lawyer_auth
  SET last_login = NOW()
  WHERE id = v_auth_row.id;

  RETURN jsonb_build_object(
    'success',    true,
    'lawyer_id',  v_lawyer_row.id,
    'name',       v_lawyer_row.name,
    'email',      v_lawyer_row.email,
    'status',     v_lawyer_row.status,
    'rejection_reason', v_lawyer_row.rejection_reason
  );
END;
$$;

-- Grant execute to anonymous (public login endpoint)
GRANT EXECUTE ON FUNCTION public.lawyer_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.lawyer_login(TEXT, TEXT) TO authenticated;

-- ============================================================
-- FIX 2: ENSURE admin_get_lawyers RETURNS ALL DOCUMENT FIELDS
-- The frontend reads: marksheet_url, bar_certificate_url, id_proof_url
-- If your existing function doesn't return these, recreate it below.
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_get_lawyers(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Validate token
  SELECT admin_id INTO v_admin_id
  FROM public.admin_sessions
  WHERE token = p_token
    AND expires_at > NOW()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', (
      SELECT jsonb_agg(row_to_json(l.*))
      FROM public.lawyers l
      ORDER BY l.created_at DESC
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_lawyers(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_get_lawyers(TEXT) TO authenticated;

-- ============================================================
-- FIX 3: Ensure lawyer_auth has last_login column
-- ============================================================
ALTER TABLE public.lawyer_auth
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- ============================================================
-- VERIFY
-- ============================================================
SELECT proname FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname IN ('lawyer_login', 'admin_get_lawyers');
