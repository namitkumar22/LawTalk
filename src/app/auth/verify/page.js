"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Scale, Mail, RefreshCw } from "lucide-react";
import { supabase } from "@/utils/supabase/client";

export default function VerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState("waiting"); // waiting | loading | success | error
  const [countdown, setCountdown] = useState(3);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    let redirectTimer;

    // Check if already verified on mount
    const checkInitial = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        setStatus("success");
        startCountdown();
      }
    };
    checkInitial();

    // Listen for auth state changes — this fires when the user clicks
    // the verification link (even in another tab/window) and the session
    // is refreshed via the Supabase SDK automatically.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          if (session?.user?.email_confirmed_at) {
            setStatus("success");
            startCountdown();
          }
        }
        if (event === "TOKEN_REFRESHED" && session?.user?.email_confirmed_at) {
          setStatus("success");
          startCountdown();
        }
      }
    );

    // Also poll every 4 seconds as a fallback (stops on success)
    const poll = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email_confirmed_at) {
        setStatus("success");
        clearInterval(poll);
        startCountdown();
      }
    }, 4000);

    function startCountdown() {
      let c = 3;
      setCountdown(c);
      const t = setInterval(() => {
        c--;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(t);
          router.push("/dashboard");
        }
      }, 1000);
      redirectTimer = t;
    }

    return () => {
      subscription.unsubscribe();
      clearInterval(poll);
      if (redirectTimer) clearInterval(redirectTimer);
    };
  }, [router]);

  const handleResend = async () => {
    setResending(true);
    setResendMsg("");
    const { data: { session } } = await supabase.auth.getSession();
    const email = session?.user?.email;
    if (!email) {
      setResendMsg("Could not find your email. Please register again.");
      setResending(false);
      return;
    }
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResendMsg(error ? "Failed to resend. Try again in a minute." : "Email resent! Check your inbox.");
    setResending(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--navy-900)" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "rgba(13,21,48,0.95)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-2xl)",
          padding: "3rem 2.5rem",
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--gradient-gold)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--navy-900)" }}>
            <Scale size={20} />
          </div>
          <span style={{ fontSize: "1.4rem", fontWeight: 800, background: "var(--gradient-gold)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LawTalk</span>
        </div>

        {/* Waiting state — shown before clicking link */}
        {status === "waiting" && (
          <>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(201,168,76,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <Mail size={32} color="var(--gold-400)" />
            </div>
            <h2 style={{ marginBottom: "0.75rem" }}>Check your inbox</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              We've sent a verification link to your email.<br />
              Click it and <strong style={{ color: "var(--gold-400)" }}>this page will automatically update</strong> — no need to refresh.
            </p>

            {/* Animated dots showing we're watching */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              <span className="spinner" style={{ width: 14, height: 14 }} />
              Waiting for verification…
            </div>

            <button
              className="btn btn-ghost"
              onClick={handleResend}
              disabled={resending}
              id="verify-resend-btn"
              style={{ width: "100%", justifyContent: "center" }}
            >
              {resending ? <span className="spinner" /> : <><RefreshCw size={14} /> Resend verification email</>}
            </button>
            {resendMsg && (
              <p style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: resendMsg.includes("resent") ? "var(--emerald)" : "#f87171" }}>
                {resendMsg}
              </p>
            )}
          </>
        )}

        {/* Success */}
        {status === "success" && (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
              <CheckCircle size={64} color="var(--emerald)" style={{ margin: "0 auto 1.5rem", display: "block" }} />
            </motion.div>
            <h2 style={{ marginBottom: "0.75rem" }}>Email Verified! 🎉</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Your account is active. Redirecting to your dashboard in <strong style={{ color: "var(--gold-400)" }}>{countdown}s</strong>…
            </p>
            <button className="btn btn-primary" onClick={() => router.push("/dashboard")} id="verify-dashboard-btn" style={{ width: "100%", justifyContent: "center" }}>
              Go to Dashboard Now
            </button>
          </>
        )}

        {/* Error */}
        {status === "error" && (
          <>
            <AlertCircle size={56} color="#f87171" style={{ margin: "0 auto 1.5rem", display: "block" }} />
            <h2 style={{ marginBottom: "0.75rem" }}>Verification Failed</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              The link may have expired or is invalid. Please try registering again or contact support.
            </p>
            <button className="btn btn-primary" onClick={() => router.push("/register")} id="verify-register-btn" style={{ width: "100%", justifyContent: "center" }}>
              Go to Register
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
