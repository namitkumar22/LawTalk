-- ============================================================
-- LAWTALK — SUPABASE COMPLETE SETUP SQL
-- Run this ENTIRELY in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: ENABLE EXTENSIONS
-- NOTE: In Supabase, pgcrypto and uuid-ossp are pre-installed.
-- Run these just in case they are not yet enabled in your project.
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- STEP 2: PROFILES TABLE (extends auth.users)
-- All registered users (clients)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  dob DATE,
  aadhaar_last4 TEXT, -- last 4 digits only, for spam prevention
  wallet_balance INTEGER DEFAULT 100, -- ₹100 welcome credits
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_blocked BOOLEAN DEFAULT FALSE,
  registration_ip TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 3: ADMINS TABLE
-- Separate admin accounts (NOT in auth.users — use custom auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- bcrypt hash
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.admins(id),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the two initial admin accounts
-- Password for namitkumar2208: @d^-^!N1 (hashed with bcrypt, rounds=12)
-- Password for admin2: Admin@2024 (you can change this)
INSERT INTO public.admins (username, password_hash, name)
VALUES 
  ('namitkumar2208', crypt('@d^-^!N1', gen_salt('bf', 12)), 'Namit Kumar'),
  ('lawtalk_admin', crypt('Admin@LT2024!', gen_salt('bf', 12)), 'LawTalk Admin')
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- STEP 4: LAWYERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lawyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Personal
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  dob DATE,
  -- Professional
  bar_council_id TEXT NOT NULL,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  experience INTEGER NOT NULL DEFAULT 0,
  languages TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT,
  education TEXT,
  -- Pricing
  price_per_chat INTEGER NOT NULL DEFAULT 30 CHECK (price_per_chat >= 5),
  availability TEXT DEFAULT 'always',
  -- Stats
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  total_consultations INTEGER DEFAULT 0,
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  -- Document URLs (Supabase Storage)
  marksheet_url TEXT,
  bar_certificate_url TEXT,
  id_proof_url TEXT,
  avatar_url TEXT,
  -- Meta
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 5: LAWYER AUTH TABLE
-- Lawyers login with email + password (separate from users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lawyer_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lawyer_id UUID NOT NULL REFERENCES public.lawyers(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verify_token TEXT,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMPTZ,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 6: CONSULTATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lawyer_id UUID NOT NULL REFERENCES public.lawyers(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  total_charged INTEGER DEFAULT 0, -- in rupees
  message_count INTEGER DEFAULT 0,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 7: MESSAGES TABLE
-- Real chat messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'lawyer')),
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  charge INTEGER DEFAULT 0, -- amount charged for this message
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 8: WALLET TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'refund')),
  amount INTEGER NOT NULL,
  description TEXT,
  consultation_id UUID REFERENCES public.consultations(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 9: ADMIN SESSIONS TABLE (for custom admin JWT)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 10: SECURITY — RATE LIMITING TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL, -- IP or email
  action TEXT NOT NULL,     -- 'login', 'register', 'admin_login'
  attempts INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(identifier, action)
);

-- ============================================================
-- STEP 11: INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_lawyers_status ON public.lawyers(status);
CREATE INDEX IF NOT EXISTS idx_lawyers_specializations ON public.lawyers USING GIN(specializations);
CREATE INDEX IF NOT EXISTS idx_lawyers_is_online ON public.lawyers(is_online) WHERE status = 'verified';
CREATE INDEX IF NOT EXISTS idx_consultations_user ON public.consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_lawyer ON public.consultations(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_messages_consultation ON public.messages(consultation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(token);

-- ============================================================
-- STEP 12: UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_lawyers_updated_at ON public.lawyers;
CREATE TRIGGER set_lawyers_updated_at
  BEFORE UPDATE ON public.lawyers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- STEP 13: AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STEP 14: FUNCTION — ADMIN LOGIN (returns session token)
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_login(p_username TEXT, p_password TEXT, p_ip TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_admin public.admins%ROWTYPE;
  v_token TEXT;
  v_session_id UUID;
BEGIN
  -- Find admin
  SELECT * INTO v_admin FROM public.admins WHERE username = p_username AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Verify password
  IF v_admin.password_hash != crypt(p_password, v_admin.password_hash) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;
  
  -- Generate secure token
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Create session (24 hour expiry)
  INSERT INTO public.admin_sessions (admin_id, token, expires_at, ip_address)
  VALUES (v_admin.id, v_token, NOW() + INTERVAL '24 hours', p_ip)
  RETURNING id INTO v_session_id;
  
  -- Update last login
  UPDATE public.admins SET last_login = NOW() WHERE id = v_admin.id;
  
  RETURN json_build_object(
    'success', true,
    'token', v_token,
    'admin', json_build_object(
      'id', v_admin.id,
      'username', v_admin.username,
      'name', v_admin.name
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 15: FUNCTION — VERIFY ADMIN TOKEN
-- ============================================================
CREATE OR REPLACE FUNCTION public.verify_admin_token(p_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_session public.admin_sessions%ROWTYPE;
  v_admin public.admins%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM public.admin_sessions 
  WHERE token = p_token AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false);
  END IF;
  
  SELECT * INTO v_admin FROM public.admins WHERE id = v_session.admin_id AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false);
  END IF;
  
  RETURN json_build_object(
    'valid', true,
    'admin', json_build_object(
      'id', v_admin.id,
      'username', v_admin.username,
      'name', v_admin.name
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 16: FUNCTION — CREATE ADMIN (by existing admin)
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_admin(
  p_token TEXT,
  p_username TEXT,
  p_password TEXT,
  p_name TEXT
)
RETURNS JSON AS $$
DECLARE
  v_verify JSON;
  v_creator_id UUID;
BEGIN
  -- Verify caller is admin
  v_verify := public.verify_admin_token(p_token);
  IF NOT (v_verify->>'valid')::BOOLEAN THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  v_creator_id := (v_verify->'admin'->>'id')::UUID;
  
  -- Check username not taken
  IF EXISTS (SELECT 1 FROM public.admins WHERE username = p_username) THEN
    RETURN json_build_object('success', false, 'error', 'Username already taken');
  END IF;
  
  -- Create new admin
  INSERT INTO public.admins (username, password_hash, name, created_by)
  VALUES (p_username, crypt(p_password, gen_salt('bf', 12)), p_name, v_creator_id);
  
  RETURN json_build_object('success', true, 'message', 'Admin created successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 17: FUNCTION — DEDUCT WALLET BALANCE
-- ============================================================
CREATE OR REPLACE FUNCTION public.deduct_wallet(
  p_user_id UUID,
  p_amount INTEGER,
  p_consultation_id UUID,
  p_description TEXT DEFAULT 'Consultation charge'
)
RETURNS JSON AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT wallet_balance INTO v_balance FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  
  IF v_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient wallet balance');
  END IF;
  
  UPDATE public.profiles SET wallet_balance = wallet_balance - p_amount WHERE id = p_user_id;
  
  INSERT INTO public.wallet_transactions (user_id, type, amount, description, consultation_id)
  VALUES (p_user_id, 'debit', p_amount, p_description, p_consultation_id);
  
  RETURN json_build_object('success', true, 'new_balance', v_balance - p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STORAGE BUCKETS — Create these in Supabase Dashboard > Storage
-- ============================================================
-- Bucket 1: "lawyer-documents" (private) — bar certificates, ID proofs, marksheets
-- Bucket 2: "lawyer-avatars" (public) — profile photos
-- Bucket 3: "chat-attachments" (private) — files shared in chat

-- ============================================================
-- VERIFY SETUP
-- ============================================================
SELECT 'Tables created:' as info, COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles','admins','lawyers','lawyer_auth','consultations','messages','wallet_transactions','admin_sessions','rate_limits');

SELECT 'Admin accounts:' as info, username, name, created_at FROM public.admins;

-- NOTE: Run SUPABASE_RLS.sql next to enable Row Level Security.



