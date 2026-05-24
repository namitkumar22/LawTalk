"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, EyeOff, AlertCircle, Scale, UserPlus } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import styles from "./page.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const { adminLogin } = useAdmin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side rate limiting
    if (attempts >= 5) {
      setError("Too many failed attempts. Please wait 15 minutes before trying again.");
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    const result = await adminLogin(username.trim(), password);
    setLoading(false);

    if (result.success) {
      router.push("/admin/dashboard");
    } else {
      setAttempts((a) => a + 1);
      setError(result.error || "Invalid username or password.");
      // Clear password on failure for security
      setPassword("");
    }
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
          <span>Admin Access Only — Restricted Portal</span>
        </div>

        <div className={styles.logoRow}>
          <div className={styles.logoIcon}><Scale size={20} /></div>
          <span className={styles.logoText}>LawTalk Admin</span>
        </div>

        <h1 className={styles.title}>Admin Portal</h1>
        <p className={styles.subtitle}>Manage lawyer verifications and platform oversight</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              id="admin-username"
              type="text"
              className="form-input"
              placeholder="Enter admin username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className={styles.passWrap}>
              <input
                id="admin-password"
                type={showPass ? "text" : "password"}
                className="form-input"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass((v) => !v)} aria-label="Toggle password visibility">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {attempts > 0 && attempts < 5 && (
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "right" }}>
              {5 - attempts} attempts remaining
            </p>
          )}

          {error && (
            <div className={styles.error}><AlertCircle size={14} /> {error}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={loading || !username || !password || attempts >= 5}
            id="admin-login-btn"
          >
            {loading ? <span className="spinner" /> : <><Lock size={16} /> Sign In as Admin</>}
          </button>
        </form>

        <p className={styles.notice}>
          This portal is restricted to authorized LawTalk administrators only.
          All login attempts are logged. Unauthorized access is a criminal offense under the IT Act 2000.
        </p>
      </motion.div>
    </div>
  );
}
