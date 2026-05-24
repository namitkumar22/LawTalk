"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Scale } from "lucide-react";
import { supabase } from "@/utils/supabase/client";

export default function VerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading | success | error

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session) {
          setStatus("success");
          setTimeout(() => router.push("/dashboard"), 2000);
        } else {
          setStatus("error");
        }
      } catch (e) {
        setStatus("error");
      }
    };
    checkSession();
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "rgba(13,21,48,0.95)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-2xl)",
          padding: "3rem 2.5rem",
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
          backdropFilter: "blur(20px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--gradient-gold)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--navy-900)" }}>
            <Scale size={20} />
          </div>
          <span style={{ fontSize: "1.4rem", fontWeight: 800, background: "var(--gradient-gold)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LawTalk</span>
        </div>

        {status === "loading" && (
          <>
            <span className="spinner" style={{ width: 40, height: 40 }} />
            <h2 style={{ marginTop: "1.5rem" }}>Verifying your email...</h2>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle size={56} color="var(--emerald)" />
            <h2 style={{ marginTop: "1.5rem" }}>Email Verified!</h2>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Your account is now active. Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle size={56} color="#f87171" />
            <h2 style={{ marginTop: "1.5rem" }}>Verification Failed</h2>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
              The link may have expired or is invalid. Please try registering again or contact support.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => router.push("/register")}
              style={{ marginTop: "1.5rem" }}
            >
              Go to Register
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
