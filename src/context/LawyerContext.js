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
  const registerLawyer = useCallback(async (formData, documents) => {
    try {
      // 1. Insert lawyer record
      const { data: lawyerRecord, error: lawyerError } = await supabase
        .from("lawyers")
        .insert({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          city: formData.city.trim(),
          state: formData.state,
          dob: formData.dob || null,
          bar_council_id: formData.barCouncilId.trim(),
          specializations: formData.specializations,
          experience: parseInt(formData.experience) || 0,
          languages: formData.languages,
          bio: formData.bio.trim(),
          education: formData.education.trim(),
          price_per_chat: parseInt(formData.pricePerMinute) || 30,
          availability: formData.availability || "always",
          status: "pending",
        })
        .select()
        .single();

      if (lawyerError) {
        if (lawyerError.code === "23505") {
          return { error: "An application with this email already exists." };
        }
        return { error: lawyerError.message };
      }

      // 2. Upload documents to Supabase Storage
      const docUploads = {};
      const docFields = ["marksheet", "barCertificate", "idProof"];
      const dbFields = ["marksheet_url", "bar_certificate_url", "id_proof_url"];

      for (let i = 0; i < docFields.length; i++) {
        const doc = documents[docFields[i]];
        if (doc) {
          const ext = doc.name.split(".").pop();
          const path = `${lawyerRecord.id}/${docFields[i]}.${ext}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("lawyer-documents")
            .upload(path, doc, { upsert: true });

          if (!uploadError) {
            docUploads[dbFields[i]] = path;
          }
        }
      }

      // 3. Update document URLs
      if (Object.keys(docUploads).length > 0) {
        await supabase
          .from("lawyers")
          .update(docUploads)
          .eq("id", lawyerRecord.id);
      }

      // 4. Create lawyer auth record (email + password for lawyer login)
      const { error: authError } = await supabase
        .from("lawyer_auth")
        .insert({
          lawyer_id: lawyerRecord.id,
          email: formData.email.toLowerCase().trim(),
          password_hash: formData.password, // Will be hashed via DB trigger or API route
        });

      return { success: true, lawyerId: lawyerRecord.id };
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
