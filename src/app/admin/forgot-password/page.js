"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Scale, AlertCircle, CheckCircle, KeyRound, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import styles from "../page.module.css";

export default function AdminForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState("request"); // request | reset | done
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Step 1: Request reset token (admin calls the RPC, gets a token back)
  // In production: this token would be emailed. Here it's shown on screen
  // for the super-admin to share via secure channel (Telegram, WhatsApp, etc.)
  const handleRequest = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!username.trim()) {
      setError("Please enter your admin username.");
      return;
    }
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc("admin_request_reset", {
      p_username: username.trim(),
    });
    setLoading(false);

    if (rpcError) {
      setError("Request failed. Please try again.");
      return;
    }

    if (data?.success) {
      if (data.token) {
        // Token is available — show it to the admin (or it would be emailed)
        setInfo(
          `Reset token generated for ${data.admin_name || username}. Token: ${data.token}\n\nCopy this token and paste it in the next step. In production, this would be emailed automatically.`
        );
      } else {
        setInfo("If that username exists, a reset token has been generated. Contact your super admin for the token.");
      }
      setStep("reset");
    } else {
      setError(data?.error || "Request failed.");
    }
  };

  // Step 2: Enter token + new password
  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    if (!token.trim()) {
      setError("Please enter the reset token.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setError("Password must contain uppercase, lowercase, and a number.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc("admin_confirm_reset", {
      p_token: token.trim(),
      p_new_password: newPassword,
    });
    setLoading(false);

    if (rpcError || !data?.success) {
      setError(data?.error || "Reset failed. The token may have expired (1 hour validity).");
      return;
    }

    setStep("done");
  };

  return (
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
        <div className={styles.adminBadge}>
          <Shield size={14} />
          <span>Admin Password Recovery</span>
        </div>

        <div className={styles.logoRow}>
          <div className={styles.logoIcon}><Scale size={20} /></div>
          <span className={styles.logoText}>LawTalk Admin</span>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Request */}
          {step === "request" && (
            <motion.div key="request" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className={styles.title}>Forgot Password?</h1>
              <p className={styles.subtitle}>Enter your admin username to generate a secure reset token</p>

              <form onSubmit={handleRequest} className={styles.form}>
                <div className="form-group">
                  <label className="form-label">Admin Username</label>
                  <input
                    id="admin-fp-username"
                    type="text"
                    className="form-input"
                    placeholder="e.g. namitkumar2208"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                    autoComplete="off"
                  />
                </div>

                {error && <div className={styles.error}><AlertCircle size={14} /> {error}</div>}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  disabled={loading || !username}
                  id="admin-fp-request-btn"
                >
                  {loading ? <span className="spinner" /> : <><KeyRound size={16} /> Generate Reset Token</>}
                </button>
              </form>
            </motion.div>
          )}

          {/* Step 2: Enter token + new password */}
          {step === "reset" && (
            <motion.div key="reset" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className={styles.title}>Reset Password</h1>
              <p className={styles.subtitle}>Enter your reset token and choose a new password</p>

              {info && (
                <div style={{
                  background: "rgba(201,168,76,0.08)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: "var(--radius-lg)",
                  padding: "var(--space-4)",
                  marginBottom: "var(--space-5)",
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  wordBreak: "break-all",
                }}>
                  <strong style={{ color: "var(--gold-400)" }}>ℹ️ Info:</strong><br />
                  {info}
                </div>
              )}

              <form onSubmit={handleReset} className={styles.form}>
                <div className="form-group">
                  <label className="form-label">Reset Token *</label>
                  <input
                    id="admin-fp-token"
                    type="text"
                    className="form-input"
                    placeholder="Paste the reset token here"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    autoComplete="off"
                    style={{ fontFamily: "monospace", fontSize: "0.8rem" }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password *</label>
                  <div className={styles.passWrap}>
                    <input
                      id="admin-fp-newpass"
                      type={showPass ? "text" : "password"}
                      className="form-input"
                      placeholder="Min 8 chars, 1 uppercase, 1 number"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password *</label>
                  <input
                    id="admin-fp-confirmpass"
                    type="password"
                    className="form-input"
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                {error && <div className={styles.error}><AlertCircle size={14} /> {error}</div>}

                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => { setStep("request"); setError(""); setInfo(""); }}
                    id="admin-fp-back-btn"
                  >
                    <ArrowLeft size={15} /> Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1, justifyContent: "center" }}
                    disabled={loading || !token || !newPassword || !confirmPassword}
                    id="admin-fp-reset-btn"
                  >
                    {loading ? <span className="spinner" /> : <><Lock size={16} /> Reset Password</>}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Done */}
          {step === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center" }}>
              <CheckCircle size={56} color="var(--emerald)" style={{ margin: "1rem auto 1.5rem", display: "block" }} />
              <h2>Password Reset!</h2>
              <p style={{ color: "var(--text-muted)", margin: "0.75rem 0 1.5rem" }}>
                Your admin password has been updated. All existing sessions have been invalidated for security. Please log in again.
              </p>
              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => router.push("/admin")}
                id="admin-fp-login-btn"
              >
                Go to Admin Login
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className={styles.notice} style={{ marginTop: "var(--space-5)" }}>
          Reset tokens expire in <strong>1 hour</strong>. All sessions are invalidated on reset.
        </p>
      </motion.div>
    </div>
  );
}
