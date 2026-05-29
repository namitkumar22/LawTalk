"use client";

// ============================================================
// LAWTALK — AUTH CONTEXT (Supabase)
// ============================================================
// Uses Supabase Auth (email/password with email verification)
// No phone OTP — prevents spam while keeping it free
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile from Supabase
  const fetchProfile = useCallback(async (authUser) => {
    if (!authUser) return null;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Failed to fetch profile:", e);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          setUser(session.user);
          const p = await fetchProfile(session.user);
          if (mounted) setProfile(p);
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          const p = await fetchProfile(session.user);
          if (mounted) setProfile(p);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Register a regular user (email + password)
  const registerUser = useCallback(async (formData) => {
    const { name, email, password, city, state, dob } = formData;

    // 2. Sign up with Supabase Auth (sends verification email automatically)
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          role: "user",
        },
        emailRedirectTo: `${window.location.origin}/auth/verify`,
      },
    });

    if (error) return { error: error.message };

    // 3. Update profile with additional fields
    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: data.user.id,
          email: email.toLowerCase().trim(),
          name: name.trim(),
          city: city?.trim(),
          state,
          dob: dob || null,
          role: "user",
          wallet_balance: 100,
        });

      if (profileError) console.error("Profile create error:", profileError);
    }

    return { 
      success: true, 
      needsVerification: !data.session, // true = email verification needed
      user: data.user 
    };
  }, []);

  // Login with email + password
  const loginUser = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        return { error: "Please verify your email first. Check your inbox." };
      }
      return { error: "Invalid email or password." };
    }

    // Check if blocked
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileData?.is_blocked) {
      await supabase.auth.signOut();
      return { error: "Your account has been suspended. Contact support." };
    }

    setUser(data.user);
    setProfile(profileData);
    return { success: true, profile: profileData };
  }, []);

  // Update profile
  const updateUser = useCallback(async (updates) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (!error) setProfile(data);
    return { data, error };
  }, [user]);

  // Deduct wallet balance
  const deductBalance = useCallback(async (amount, consultationId, description = "Consultation charge") => {
    if (!user || !profile) return { error: "Not authenticated" };

    const { data, error } = await supabase.rpc("deduct_wallet", {
      p_user_id: user.id,
      p_amount: amount,
      p_consultation_id: consultationId,
      p_description: description,
    });

    if (!error && data?.success) {
      setProfile((prev) => ({ ...prev, wallet_balance: data.new_balance }));
      return { success: true, newBalance: data.new_balance };
    }

    return { error: data?.error || error?.message || "Failed to deduct balance" };
  }, [user, profile]);

  // Resend verification email
  const resendVerification = useCallback(async (email) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.toLowerCase().trim(),
    });
    return { error: error?.message };
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error: error?.message };
  }, []);

  // Logout
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  // Merge user + profile for backward compatibility
  const mergedUser = user && profile ? {
    id: user.id,
    email: user.email,
    name: profile.name,
    city: profile.city,
    state: profile.state,
    dob: profile.dob,
    role: profile.role || "user",
    walletBalance: profile.wallet_balance,
    emailVerified: !!user.email_confirmed_at,
    isBlocked: profile.is_blocked,
  } : null;

  const value = {
    user: mergedUser,
    rawUser: user,
    profile,
    loading,
    isAuthenticated: !!user && !!profile,
    isUser: profile?.role === "user",
    registerUser,
    loginUser,
    updateUser,
    deductBalance,
    resendVerification,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
