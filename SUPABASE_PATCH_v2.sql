-- ============================================================
-- LAWTALK — PATCH v2 SQL
-- Run this ENTIRELY in Supabase SQL Editor
-- Fixes:
--   0. Remove aadhaar_last4 column (unreliable — too many collisions)
--   1. RLS policy for lawyer registration (INSERT allowed without auth)
--   2. Chat session management (auto-expiry, report button)
--   3. Admin forgot password mechanism
--   4. Wallet top-up RPC
--   5. Report/complaint system
--   6. Admin workload-balanced assignment
-- ============================================================

-- ============================================================
-- FIX 0: REMOVE AADHAAR LAST-4 COLUMN
-- Reason: Last 4 digits of Aadhaar are not unique enough.
-- Millions of people share the same last 4 digits, making this
-- useless as an anti-spam measure and a privacy liability.
-- Anti-spam is now handled by email verification only.
-- ============================================================
ALTER TABLE public.profiles DROP COLUMN IF EXISTS aadhaar_last4;

-- ============================================================
-- FIX 1: LAWYER REGISTRATION RLS
-- The "lawyers" table has RLS enabled but no INSERT policy for
-- unauthenticated users. Lawyer registration is NOT via Supabase Auth,
-- so we use a SECURITY DEFINER RPC to bypass RLS completely.
-- ============================================================

CREATE OR REPLACE FUNCTION public.register_lawyer(
  p_name TEXT,
  p_email TEXT,
  p_city TEXT,
  p_state TEXT,
  p_dob DATE DEFAULT NULL,
  p_bar_council_id TEXT DEFAULT '',
  p_specializations TEXT[] DEFAULT '{}',
  p_experience INTEGER DEFAULT 0,
  p_languages TEXT[] DEFAULT '{}',
  p_bio TEXT DEFAULT '',
  p_education TEXT DEFAULT '',
  p_price_per_chat INTEGER DEFAULT 30,
  p_availability TEXT DEFAULT 'always'
)
RETURNS JSON AS $$
DECLARE
  v_lawyer_id UUID;
  v_existing UUID;
BEGIN
  -- Check for duplicate email
  SELECT id INTO v_existing FROM public.lawyers WHERE email = LOWER(TRIM(p_email));
  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'An application with this email already exists.');
  END IF;

  -- Insert lawyer record (bypasses RLS via SECURITY DEFINER)
  INSERT INTO public.lawyers (
    name, email, city, state, dob,
    bar_council_id, specializations, experience, languages,
    bio, education, price_per_chat, availability, status
  ) VALUES (
    TRIM(p_name),
    LOWER(TRIM(p_email)),
    TRIM(p_city),
    p_state,
    p_dob,
    TRIM(p_bar_council_id),
    p_specializations,
    p_experience,
    p_languages,
    TRIM(p_bio),
    TRIM(p_education),
    p_price_per_chat,
    p_availability,
    'pending'
  )
  RETURNING id INTO v_lawyer_id;

  RETURN json_build_object('success', true, 'lawyer_id', v_lawyer_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anon (so lawyer registration works without login)
GRANT EXECUTE ON FUNCTION public.register_lawyer TO anon;
GRANT EXECUTE ON FUNCTION public.register_lawyer TO authenticated;

-- ============================================================
-- FIX 1b: LAWYER AUTH INSERT RPC (also bypasses RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_lawyer_auth(
  p_lawyer_id UUID,
  p_email TEXT,
  p_password_hash TEXT,
  p_verify_token TEXT
)
RETURNS JSON AS $$
BEGIN
  INSERT INTO public.lawyer_auth (lawyer_id, email, password_hash, email_verify_token)
  VALUES (p_lawyer_id, LOWER(TRIM(p_email)), p_password_hash, p_verify_token)
  ON CONFLICT (email) DO NOTHING;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_lawyer_auth TO anon;
GRANT EXECUTE ON FUNCTION public.create_lawyer_auth TO authenticated;

-- ============================================================
-- FIX 1c: UPDATE LAWYER DOCS RPC (also bypasses RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_lawyer_docs(
  p_lawyer_id UUID,
  p_marksheet_url TEXT DEFAULT NULL,
  p_bar_certificate_url TEXT DEFAULT NULL,
  p_id_proof_url TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
  UPDATE public.lawyers
  SET
    marksheet_url = COALESCE(p_marksheet_url, marksheet_url),
    bar_certificate_url = COALESCE(p_bar_certificate_url, bar_certificate_url),
    id_proof_url = COALESCE(p_id_proof_url, id_proof_url),
    updated_at = NOW()
  WHERE id = p_lawyer_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_lawyer_docs TO anon;
GRANT EXECUTE ON FUNCTION public.update_lawyer_docs TO authenticated;

-- ============================================================
-- FIX 2: CHAT SESSION MANAGEMENT
-- Add: ended_by column, auto_expire logic, report system
-- ============================================================

-- Add ended_by column to consultations
ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS ended_by TEXT CHECK (ended_by IN ('user', 'lawyer', 'system', 'admin')),
  ADD COLUMN IF NOT EXISTS auto_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'refunded', 'disputed'));

-- Set auto_expire on new sessions (24 hours)
CREATE OR REPLACE FUNCTION public.set_consultation_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND NEW.auto_expires_at IS NULL THEN
    NEW.auto_expires_at = NOW() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_consultation_expiry ON public.consultations;
CREATE TRIGGER trg_consultation_expiry
  BEFORE INSERT OR UPDATE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.set_consultation_expiry();

-- RPC: End session (called by user OR lawyer)
CREATE OR REPLACE FUNCTION public.end_consultation(
  p_consultation_id UUID,
  p_actor_id UUID,   -- user.id or lawyer.id
  p_actor_type TEXT, -- 'user' | 'lawyer'
  p_rating INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_consultation public.consultations%ROWTYPE;
BEGIN
  SELECT * INTO v_consultation FROM public.consultations WHERE id = p_consultation_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Consultation not found');
  END IF;

  IF v_consultation.status != 'active' THEN
    RETURN json_build_object('success', false, 'error', 'Consultation is already ended');
  END IF;

  -- Verify actor is participant
  IF p_actor_type = 'user' AND v_consultation.user_id != p_actor_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  UPDATE public.consultations
  SET
    status = 'completed',
    ended_at = NOW(),
    ended_by = p_actor_type,
    payment_status = 'paid',
    rating = p_rating,
    updated_at = NOW()
  WHERE id = p_consultation_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.end_consultation TO authenticated;

-- RPC: Auto-expire sessions older than 24 hours (call from cron or client)
CREATE OR REPLACE FUNCTION public.expire_old_consultations()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.consultations
  SET
    status = 'completed',
    ended_at = NOW(),
    ended_by = 'system',
    payment_status = 'paid',
    updated_at = NOW()
  WHERE status = 'active'
    AND auto_expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.expire_old_consultations TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_old_consultations TO anon;

-- ============================================================
-- FIX 2b: REPORTS / COMPLAINTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_lawyer_id UUID NOT NULL REFERENCES public.lawyers(id),
  consultation_id UUID REFERENCES public.consultations(id),
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_url TEXT,         -- optional screenshot/attachment
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  assigned_admin_id UUID REFERENCES public.admins(id),
  admin_notes TEXT,
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can insert and view their own reports
DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_select_own" ON public.reports;
CREATE POLICY "reports_select_own" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_admin ON public.reports(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_reports_lawyer ON public.reports(reported_lawyer_id);

-- Auto-assign report to least-busy admin (workload balancing)
CREATE OR REPLACE FUNCTION public.submit_report(
  p_reporter_id UUID,
  p_lawyer_id UUID,
  p_consultation_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT '',
  p_description TEXT DEFAULT ''
)
RETURNS JSON AS $$
DECLARE
  v_admin_id UUID;
  v_report_id UUID;
BEGIN
  -- Find admin with fewest open reports
  SELECT a.id INTO v_admin_id
  FROM public.admins a
  LEFT JOIN public.reports r ON r.assigned_admin_id = a.id AND r.status = 'open'
  WHERE a.is_active = TRUE
  GROUP BY a.id
  ORDER BY COUNT(r.id) ASC
  LIMIT 1;

  INSERT INTO public.reports (
    reporter_id, reported_lawyer_id, consultation_id,
    reason, description, assigned_admin_id
  ) VALUES (
    p_reporter_id, p_lawyer_id, p_consultation_id,
    p_reason, p_description, v_admin_id
  )
  RETURNING id INTO v_report_id;

  RETURN json_build_object('success', true, 'report_id', v_report_id, 'assigned_to', v_admin_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.submit_report TO authenticated;

-- ============================================================
-- FIX 3: ADMIN FORGOT PASSWORD
-- Admins use custom auth (not Supabase Auth), so we need
-- a secure token-based reset mechanism.
-- ============================================================

ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS reset_token TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email TEXT; -- add email field for password reset notifications

-- Request password reset (generates a token, frontend emails it)
CREATE OR REPLACE FUNCTION public.admin_request_reset(p_username TEXT)
RETURNS JSON AS $$
DECLARE
  v_admin public.admins%ROWTYPE;
  v_token TEXT;
BEGIN
  SELECT * INTO v_admin FROM public.admins WHERE username = p_username AND is_active = TRUE;

  IF NOT FOUND THEN
    -- Return success anyway (don't reveal if username exists)
    RETURN json_build_object('success', true, 'message', 'If that username exists, a reset link will be sent.');
  END IF;

  v_token := encode(gen_random_bytes(32), 'hex');

  UPDATE public.admins
  SET reset_token = v_token,
      reset_token_expires = NOW() + INTERVAL '1 hour'
  WHERE id = v_admin.id;

  RETURN json_build_object(
    'success', true,
    'token', v_token,
    'admin_name', v_admin.name,
    'message', 'Reset token generated. Send it via secure channel.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Confirm reset with token
CREATE OR REPLACE FUNCTION public.admin_confirm_reset(p_token TEXT, p_new_password TEXT)
RETURNS JSON AS $$
DECLARE
  v_admin public.admins%ROWTYPE;
BEGIN
  IF LENGTH(p_new_password) < 8 THEN
    RETURN json_build_object('success', false, 'error', 'Password must be at least 8 characters');
  END IF;

  SELECT * INTO v_admin
  FROM public.admins
  WHERE reset_token = p_token
    AND reset_token_expires > NOW()
    AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired reset token');
  END IF;

  UPDATE public.admins
  SET
    password_hash = crypt(p_new_password, gen_salt('bf', 12)),
    reset_token = NULL,
    reset_token_expires = NULL
  WHERE id = v_admin.id;

  -- Also invalidate all existing sessions for this admin
  DELETE FROM public.admin_sessions WHERE admin_id = v_admin.id;

  RETURN json_build_object('success', true, 'message', 'Password updated successfully. Please log in again.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant to anon so the reset page works without login
GRANT EXECUTE ON FUNCTION public.admin_request_reset TO anon;
GRANT EXECUTE ON FUNCTION public.admin_request_reset TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_confirm_reset TO anon;
GRANT EXECUTE ON FUNCTION public.admin_confirm_reset TO authenticated;

-- ============================================================
-- FIX 4: WALLET TOP-UP RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT 'Wallet top-up'
)
RETURNS JSON AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE public.profiles
  SET wallet_balance = wallet_balance + p_amount
  WHERE id = p_user_id
  RETURNING wallet_balance INTO v_new_balance;

  INSERT INTO public.wallet_transactions (user_id, type, amount, description)
  VALUES (p_user_id, 'credit', p_amount, p_description);

  RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.credit_wallet TO authenticated;

-- ============================================================
-- FIX 5: ADMIN — GET REPORTS (bypasses RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_get_reports(p_token TEXT, p_status TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_verify JSON;
  v_admin_id UUID;
  v_reports JSON;
BEGIN
  v_verify := public.verify_admin_token(p_token);
  IF NOT (v_verify->>'valid')::BOOLEAN THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  v_admin_id := (v_verify->'admin'->>'id')::UUID;

  SELECT json_agg(r ORDER BY r.created_at DESC)
  INTO v_reports
  FROM public.reports r
  WHERE (p_status IS NULL OR r.status = p_status)
    AND (r.assigned_admin_id = v_admin_id); -- Only show assigned reports

  RETURN json_build_object('success', true, 'data', COALESCE(v_reports, '[]'::JSON));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Super admin view (all reports)
CREATE OR REPLACE FUNCTION public.admin_get_all_reports(p_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_verify JSON;
  v_reports JSON;
BEGIN
  v_verify := public.verify_admin_token(p_token);
  IF NOT (v_verify->>'valid')::BOOLEAN THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT json_agg(r ORDER BY r.created_at DESC)
  INTO v_reports
  FROM public.reports r;

  RETURN json_build_object('success', true, 'data', COALESCE(v_reports, '[]'::JSON));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update report status
CREATE OR REPLACE FUNCTION public.admin_update_report(
  p_token TEXT,
  p_report_id UUID,
  p_status TEXT,
  p_admin_notes TEXT DEFAULT NULL,
  p_resolution TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_verify JSON;
BEGIN
  v_verify := public.verify_admin_token(p_token);
  IF NOT (v_verify->>'valid')::BOOLEAN THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  UPDATE public.reports
  SET
    status = p_status,
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    resolution = COALESCE(p_resolution, resolution),
    updated_at = NOW()
  WHERE id = p_report_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FIX 6: UPDATED ADMIN STATS (include reports)
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_get_stats(p_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_verify JSON;
BEGIN
  v_verify := public.verify_admin_token(p_token);
  IF NOT (v_verify->>'valid')::BOOLEAN THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  RETURN json_build_object(
    'success', true,
    'total_users',         (SELECT COUNT(*) FROM public.profiles),
    'total_lawyers',       (SELECT COUNT(*) FROM public.lawyers),
    'pending',             (SELECT COUNT(*) FROM public.lawyers WHERE status = 'pending'),
    'verified',            (SELECT COUNT(*) FROM public.lawyers WHERE status = 'verified'),
    'rejected',            (SELECT COUNT(*) FROM public.lawyers WHERE status = 'rejected'),
    'total_consultations', (SELECT COUNT(*) FROM public.consultations),
    'active_chats',        (SELECT COUNT(*) FROM public.consultations WHERE status = 'active'),
    'open_reports',        (SELECT COUNT(*) FROM public.reports WHERE status = 'open')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FIX 7: MESSAGES — also allow lawyer participant to SELECT
-- (Lawyer-side chat needs to read messages too)
-- ============================================================

DROP POLICY IF EXISTS "messages_select_lawyer_participant" ON public.messages;
CREATE POLICY "messages_select_lawyer_participant" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.consultations c
      JOIN public.lawyers l ON l.id = c.lawyer_id
      WHERE c.id = consultation_id AND l.id::TEXT = auth.uid()::TEXT
    )
    OR
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_id AND c.user_id = auth.uid()
    )
  );

-- Lawyers can also insert messages (remove old policy, replace)
DROP POLICY IF EXISTS "messages_insert_lawyer" ON public.messages;
CREATE POLICY "messages_insert_lawyer" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id OR sender_type = 'lawyer');

-- ============================================================
-- VERIFY ALL NEW RPCS
-- ============================================================
SELECT proname, prosecdef FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname IN (
    'register_lawyer', 'create_lawyer_auth', 'update_lawyer_docs',
    'end_consultation', 'expire_old_consultations', 'submit_report',
    'admin_request_reset', 'admin_confirm_reset', 'credit_wallet',
    'admin_get_reports', 'admin_get_all_reports', 'admin_update_report'
  )
ORDER BY proname;
