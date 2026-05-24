"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Mail, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import styles from "../../login/page.module.css";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
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

        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}><Scale size={20} /></div>
            <span className={styles.logoText}>LawTalk</span>
          </div>

          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className={styles.title}>Reset Password</h1>
                <p className={styles.subtitle}>Enter your email and we&apos;ll send a reset link</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className="form-group">
                    <label className="form-label"><Mail size={12} /> Email Address</label>
                    <input
                      id="forgot-email"
                      type="email"
                      className="form-input"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className={styles.error}>
                      <AlertCircle size={14} /> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                    disabled={loading || !email}
                    id="forgot-submit-btn"
                  >
                    {loading ? <span className="spinner" /> : <>Send Reset Link <ArrowRight size={16} /></>}
                  </button>
                </form>

                <p className={styles.switch}>
                  Remember your password?{" "}
                  <Link href="/login" className={styles.switchLink}>Sign In</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={styles.successState}
              >
                <div className={styles.successIcon}>
                  <CheckCircle size={48} color="var(--emerald)" />
                </div>
                <h2>Reset Link Sent!</h2>
                <p style={{ textAlign: "center" }}>
                  Check your inbox at <strong style={{ color: "var(--gold-400)" }}>{email}</strong>.
                  <br />Click the link to set a new password.
                </p>
                <Link href="/login" className="btn btn-secondary" style={{ marginTop: "var(--space-4)" }}>
                  Back to Login
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
