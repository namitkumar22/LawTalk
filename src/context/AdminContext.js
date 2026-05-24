"use client";

// ============================================================
// LAWTALK — ADMIN CONTEXT (Supabase)
// ============================================================
// Custom admin auth using Supabase RPC function + session tokens
// Admins are stored in public.admins table with bcrypt passwords
// Not connected to Supabase Auth (intentionally separate)
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";

const AdminContext = createContext(null);

const ADMIN_TOKEN_KEY = "lawtalk_admin_token";

export function AdminProvider({ children }) {
  const [adminSession, setAdminSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (token) {
        try {
          const { data, error } = await supabase.rpc("verify_admin_token", {
            p_token: token,
          });
          if (!error && data?.valid) {
            setAdminSession({ ...data.admin, token });
          } else {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
          }
        } catch (e) {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  // Admin login (username + password, verified server-side)
  const adminLogin = useCallback(async (username, password) => {
    try {
      const { data, error } = await supabase.rpc("admin_login", {
        p_username: username,
        p_password: password,
      });

      if (error) return { success: false, error: "Authentication failed" };
      if (!data?.success) return { success: false, error: data?.error || "Invalid credentials" };

      const session = { ...data.admin, token: data.token };
      setAdminSession(session);
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      return { success: true };
    } catch (e) {
      return { success: false, error: "Login failed. Please try again." };
    }
  }, []);

  // Admin logout
  const adminLogout = useCallback(async () => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
      // Delete session from DB
      await supabase
        .from("admin_sessions")
        .delete()
        .eq("token", token);
    }
    setAdminSession(null);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }, []);

  // Create a new admin account (only existing admins can do this)
  const createAdmin = useCallback(async (username, password, name) => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return { success: false, error: "Not authenticated" };

    const { data, error } = await supabase.rpc("create_admin", {
      p_token: token,
      p_username: username,
      p_password: password,
      p_name: name,
    });

    if (error) return { success: false, error: error.message };
    return data;
  }, []);

  // Get all admins (for super admin view)
  const getAdmins = useCallback(async () => {
    if (!adminSession) return [];
    const { data, error } = await supabase
      .from("admins")
      .select("id, username, name, is_active, last_login, created_at")
      .order("created_at");
    return error ? [] : data;
  }, [adminSession]);

  return (
    <AdminContext.Provider
      value={{
        adminSession,
        loading,
        isAdmin: !!adminSession,
        adminLogin,
        adminLogout,
        createAdmin,
        getAdmins,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}
