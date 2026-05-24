-- ============================================================
-- LAWTALK — ROW LEVEL SECURITY SETUP
-- Safe to re-run multiple times (fully idempotent)
-- ============================================================

-- ============================================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lawyer_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 2: PROFILES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- STEP 3: LAWYERS POLICIES
-- Anyone can read verified lawyers (public data)
-- Pending/rejected only visible via admin RPC
-- ============================================================
DROP POLICY IF EXISTS "lawyers_select_verified_public" ON public.lawyers;
CREATE POLICY "lawyers_select_verified_public" ON public.lawyers
  FOR SELECT USING (status = 'verified' AND is_blocked = FALSE);

-- ============================================================
-- STEP 4: CONSULTATIONS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "consultations_select_own" ON public.consultations;
CREATE POLICY "consultations_select_own" ON public.consultations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "consultations_insert_own" ON public.consultations;
CREATE POLICY "consultations_insert_own" ON public.consultations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "consultations_update_own" ON public.consultations;
CREATE POLICY "consultations_update_own" ON public.consultations
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- STEP 5: MESSAGES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "messages_select_participant" ON public.messages;
CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.consultations c
      WHERE c.id = consultation_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
CREATE POLICY "messages_insert_own" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ============================================================
-- STEP 6: WALLET POLICIES
-- ============================================================
DROP POLICY IF EXISTS "wallet_select_own" ON public.wallet_transactions;
CREATE POLICY "wallet_select_own" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- STEP 7: ADMIN/SESSION/AUTH TABLES — NO DIRECT ACCESS
-- All ops go through SECURITY DEFINER RPCs which bypass RLS
-- (No policies = completely locked from anon/authenticated roles)
-- ============================================================

-- ============================================================
-- STEP 8: ADMIN RPC — GET ALL LAWYERS (bypasses RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_get_lawyers(p_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_verify JSON;
  v_lawyers JSON;
BEGIN
  v_verify := public.verify_admin_token(p_token);
  IF NOT (v_verify->>'valid')::BOOLEAN THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT json_agg(l ORDER BY l.created_at DESC)
  INTO v_lawyers
  FROM public.lawyers l;

  RETURN json_build_object('success', true, 'data', COALESCE(v_lawyers, '[]'::JSON));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 9: ADMIN RPC — UPDATE LAWYER STATUS (bypasses RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_update_lawyer(
  p_token TEXT,
  p_lawyer_id UUID,
  p_status TEXT,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_verify JSON;
BEGIN
  v_verify := public.verify_admin_token(p_token);
  IF NOT (v_verify->>'valid')::BOOLEAN THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  UPDATE public.lawyers
  SET
    status = p_status,
    rejection_reason = p_rejection_reason,
    verified_at = CASE WHEN p_status = 'verified' THEN NOW() ELSE NULL END,
    updated_at = NOW()
  WHERE id = p_lawyer_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 10: ADMIN RPC — GET PLATFORM STATS (bypasses RLS)
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
    'total_consultations', (SELECT COUNT(*) FROM public.consultations)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VERIFY — RLS active on all tables
-- ============================================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
