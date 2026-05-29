"use client";

// ============================================================
// LAWTALK — LAWYER CONTEXT (Supabase)
// ============================================================
// All lawyer data fetched from Supabase — no localStorage
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";

const LawyerContext = createContext(null);

export function LawyerProvider({ children }) {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Fetch all lawyers from Supabase
  const fetchLawyers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("lawyers")
        .select("*")
        .eq("is_blocked", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Normalize DB fields to match frontend expectations
      setLawyers((data || []).map(normalizeLawyer));
    } catch (e) {
      console.error("Failed to fetch lawyers:", e);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    fetchLawyers();

    // Real-time subscription for online status updates
    const channel = supabase
      .channel("lawyers-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "lawyers" },
        (payload) => {
          setLawyers((prev) =>
            prev.map((l) => l.id === payload.new.id ? normalizeLawyer(payload.new) : l)
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchLawyers]);

  // Normalize DB snake_case → camelCase for frontend
  function normalizeLawyer(row) {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      city: row.city,
      state: row.state,
      dob: row.dob,
      barCouncilId: row.bar_council_id,
      specializations: row.specializations || [],
      experience: row.experience || 0,
      languages: row.languages || [],
      bio: row.bio || "",
      education: row.education || "",
      pricePerMinute: row.price_per_chat || 30,
      availability: row.availability || "always",
      rating: Number(row.rating) || 0,
      reviewCount: row.review_count || 0,
      totalConsultations: row.total_consultations || 0,
      isOnline: row.is_online || false,
      status: row.status || "pending",
      rejectionReason: row.rejection_reason || "",
      marksheetUrl: row.marksheet_url,
      barCertificateUrl: row.bar_certificate_url,
      idProofUrl: row.id_proof_url,
      avatarUrl: row.avatar_url,
      verifiedAt: row.verified_at,
      createdAt: row.created_at,
    };
  }

  const verifiedLawyers = lawyers.filter((l) => l.status === "verified");
  const pendingLawyers = lawyers.filter((l) => l.status === "pending");

  const getLawyerById = useCallback(
    (id) => lawyers.find((l) => l.id === id) || null,
    [lawyers]
  );

  // Admin: verify or reject a lawyer
  const verifyLawyer = useCallback(async (id, status, reason = "") => {
    const token = localStorage.getItem("lawtalk_admin_token");
    const updates = {
      status,
      rejection_reason: reason || null,
      verified_at: status === "verified" ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from("lawyers")
      .update(updates)
      .eq("id", id);

    if (!error) {
      setLawyers((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, status, rejectionReason: reason, verifiedAt: updates.verified_at } : l
        )
      );
    }
    return { error };
  }, []);

  // Lawyer: toggle online status
  const toggleOnlineStatus = useCallback(async (id, isOnline) => {
    const { error } = await supabase
      .from("lawyers")
      .update({ is_online: isOnline })
      .eq("id", id);

    if (!error) {
      setLawyers((prev) =>
        prev.map((l) => (l.id === id ? { ...l, isOnline } : l))
      );
    }
    return { error };
  }, []);

  // Update lawyer profile fields
  const updateLawyer = useCallback(async (id, updates) => {
    // Convert camelCase → snake_case for DB
    const dbUpdates = {};
    if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
    if (updates.reviewCount !== undefined) dbUpdates.review_count = updates.reviewCount;
    if (updates.totalConsultations !== undefined) dbUpdates.total_consultations = updates.totalConsultations;
    if (updates.isOnline !== undefined) dbUpdates.is_online = updates.isOnline;

    const { error } = await supabase
      .from("lawyers")
      .update(dbUpdates)
      .eq("id", id);

    if (!error) {
      setLawyers((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
      );
    }
    return { error };
  }, []);

  // Register a new lawyer (submit application)
  // Uses SECURITY DEFINER RPCs to bypass RLS — lawyers are not Supabase Auth users
  const registerLawyer = useCallback(async (formData, documents) => {
    try {
      // 1. Call register_lawyer RPC (bypasses RLS via SECURITY DEFINER)
      const { data: rpcResult, error: rpcError } = await supabase.rpc("register_lawyer", {
        p_name: formData.name.trim(),
        p_email: formData.email.toLowerCase().trim(),
        p_city: formData.city.trim(),
        p_state: formData.state,
        p_dob: formData.dob || null,
        p_bar_council_id: formData.barCouncilId.trim(),
        p_specializations: formData.specializations,
        p_experience: parseInt(formData.experience) || 0,
        p_languages: formData.languages,
        p_bio: formData.bio.trim(),
        p_education: formData.education.trim(),
        p_price_per_chat: parseInt(formData.pricePerMinute) || 30,
        p_availability: formData.availability || "always",
      });

      if (rpcError) return { error: rpcError.message };
      if (!rpcResult?.success) return { error: rpcResult?.error || "Registration failed." };

      const lawyerId = rpcResult.lawyer_id;

      // 2. Upload documents to Supabase Storage
      const docUploads = { marksheet_url: null, bar_certificate_url: null, id_proof_url: null };
      const docMap = [
        { field: "marksheet", dbField: "marksheet_url" },
        { field: "barCertificate", dbField: "bar_certificate_url" },
        { field: "idProof", dbField: "id_proof_url" },
      ];

      for (const { field, dbField } of docMap) {
        const doc = documents[field];
        if (doc) {
          const ext = doc.name.split(".").pop();
          const path = `${lawyerId}/${field}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("lawyer-documents")
            .upload(path, doc, { upsert: true });

          if (!uploadError) docUploads[dbField] = path;
        }
      }

      // 3. Update document URLs via RPC (bypasses RLS)
      if (Object.values(docUploads).some(Boolean)) {
        await supabase.rpc("update_lawyer_docs", {
          p_lawyer_id: lawyerId,
          p_marksheet_url: docUploads.marksheet_url,
          p_bar_certificate_url: docUploads.bar_certificate_url,
          p_id_proof_url: docUploads.id_proof_url,
        });
      }

      // 4. Create lawyer auth (email + hashed password) via RPC
      // Generate a simple verify token — in production, email this link
      const verifyToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
      await supabase.rpc("create_lawyer_auth", {
        p_lawyer_id: lawyerId,
        p_email: formData.email.toLowerCase().trim(),
        p_password_hash: formData.password, // DB hashes with pgcrypto
        p_verify_token: verifyToken,
      });

      return { success: true, lawyerId };
    } catch (e) {
      return { error: e.message || "Registration failed" };
    }
  }, []);

  return (
    <LawyerContext.Provider
      value={{
        lawyers,
        verifiedLawyers,
        pendingLawyers,
        loading,
        initialized,
        getLawyerById,
        verifyLawyer,
        toggleOnlineStatus,
        updateLawyer,
        registerLawyer,
        refetch: fetchLawyers,
      }}
    >
      {children}
    </LawyerContext.Provider>
  );
}

export function useLawyers() {
  const ctx = useContext(LawyerContext);
  if (!ctx) throw new Error("useLawyers must be used inside <LawyerProvider>");
  return ctx;
}
