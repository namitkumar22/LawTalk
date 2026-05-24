"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Scale, Eye, EyeOff, AlertCircle, CheckCircle, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { loginUser } = useAuth();
  const [step, setStep] = useState("form"); // form | success | verify
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const result = await loginUser(email.trim(), password);
    setLoading(false);

    if (result.error) {
      if (result.error.includes("verify your email")) {
        setStep("verify");
      } else {
        setError(result.error);
      }
      return;
    }

    // Redirect based on role
    setStep("success");
    setTimeout(() => {
      const role = result.profile?.role;
      router.push(role === "admin" ? "/admin/dashboard" : "/dashboard");
    }, 1200);
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
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}><Scale size={20} /></div>
            <span className={styles.logoText}>LawTalk</span>
          </div>

          <AnimatePresence mode="wait">
            {step === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className={styles.title}>Welcome Back</h1>
                <p className={styles.subtitle}>Sign in to your LawTalk account</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className="form-group">
                    <label className="form-label"><Mail size={12} /> Email Address</label>
                    <input
                      id="login-email"
                      type="email"
                      className="form-input"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                      autoComplete="email"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label"><Lock size={12} /> Password</label>
                    <div className={styles.passWrap}>
                      <input
                        id="login-password"
                        type={showPass ? "text" : "password"}
                        className="form-input"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className={styles.eyeBtn}
                        onClick={() => setShowPass((v) => !v)}
                        aria-label="Toggle password visibility"
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.forgotRow}>
                    <Link href="/auth/forgot-password" className={styles.forgotLink}>
                      Forgot password?
                    </Link>
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
                    disabled={loading || !email || !password}
                    id="login-submit-btn"
                  >
                    {loading ? <span className="spinner" /> : <>Sign In <ArrowRight size={16} /></>}
                  </button>
                </form>

                <p className={styles.switch}>
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className={styles.switchLink}>Create Account</Link>
                </p>
                <p className={styles.switch}>
                  Are you a lawyer?{" "}
                  <Link href="/lawyer/register" className={styles.switchLink}>Register here</Link>
                </p>
              </motion.div>
            )}

            {step === "verify" && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={styles.successState}
              >
                <div className={styles.successIcon}>
                  <Mail size={40} color="var(--gold-400)" />
                </div>
                <h2>Verify Your Email</h2>
                <p>
                  Please check your inbox at <strong>{email}</strong> and click the
                  verification link before signing in.
                </p>
                <button
                  className="btn btn-secondary"
                  onClick={() => setStep("form")}
                  id="login-back-btn"
                  style={{ marginTop: "var(--space-4)" }}
                >
                  ← Back to Login
                </button>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={styles.successState}
              >
                <div className={styles.successIcon}>
                  <CheckCircle size={40} color="var(--emerald)" />
                </div>
                <h2>Login Successful!</h2>
                <p>Redirecting you to your dashboard...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Admin link */}
          <div className={styles.adminLink}>
            <Link href="/admin" className={styles.adminLinkText}>
              <Lock size={12} /> Admin Login
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
