"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Scale, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import Navbar from "@/components/layout/Navbar";
import styles from "../../login/page.module.css";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    }>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase puts the token in the URL hash. The auth listener will
  // pick it up automatically and establish a session.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError("Password must contain uppercase, lowercase, and a number.");
      return;
    }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message || "Failed to update password. The link may have expired.");
    } else {
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.bg}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />
        </div>

        <motion.div className={styles.card} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}><Scale size={20} /></div>
            <span className={styles.logoText}>LawTalk</span>
          </div>

          {done ? (
            <div className={styles.successState}>
              <div className={styles.successIcon}><CheckCircle size={48} color="var(--emerald)" /></div>
              <h2>Password Updated!</h2>
              <p>Your password has been changed. Redirecting to login…</p>
            </div>
          ) : (
            <>
              <h1 className={styles.title}>Set New Password</h1>
              <p className={styles.subtitle}>Choose a strong password for your account</p>

              {!sessionReady && (
                <div className={styles.error} style={{ marginBottom: "var(--space-4)" }}>
                  <AlertCircle size={14} /> Waiting for secure session… If this persists, request a new reset link.
                </div>
              )}

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className="form-group">
                  <label className="form-label"><Lock size={12} /> New Password</label>
                  <div className={styles.passWrap}>
                    <input
                      id="reset-password"
                      type={showPass ? "text" : "password"}
                      className="form-input"
                      placeholder="Min. 8 chars, upper + lower + number"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                      autoComplete="new-password"
                    />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label"><Lock size={12} /> Confirm Password</label>
                  <input
                    id="reset-confirm"
                    type="password"
                    className="form-input"
                    placeholder="Repeat your new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                {error && <div className={styles.error}><AlertCircle size={14} /> {error}</div>}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  disabled={loading || !password || !confirm || !sessionReady}
                  id="reset-submit-btn"
                >
                  {loading ? <span className="spinner" /> : <>Update Password <ArrowRight size={16} /></>}
                </button>
              </form>

              <p className={styles.switch}>
                Remembered it? <Link href="/login" className={styles.switchLink}>Sign In</Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </>
  );
}
