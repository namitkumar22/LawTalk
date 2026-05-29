"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, ArrowRight, CheckCircle, AlertCircle, User, Mail, Lock, MapPin, Calendar, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import styles from "../login/page.module.css";
import regStyles from "./page.module.css";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra",
  "Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim",
  "Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi",
  "Jammu & Kashmir","Ladakh","Puducherry","Chandigarh",
];

export default function RegisterPage() {
  const router = useRouter();
  const { registerUser, isAuthenticated, user, loading } = useAuth();

  // Guard: redirect if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(user?.role === "lawyer" ? "/lawyer/dashboard" : "/dashboard");
    }
  }, [isAuthenticated, loading, user, router]);
  const [step, setStep] = useState("form"); // form | verify | success
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "",
    state: "",
    dob: "",
    agreeTerms: false,
  });

  const update = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const validateForm = () => {
    if (!form.name.trim() || form.name.trim().length < 3) return "Please enter your full name (min. 3 characters).";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email address.";
    if (!form.password || form.password.length < 8) return "Password must be at least 8 characters.";
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      return "Password must contain at least one uppercase letter, one lowercase letter, and one number.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    if (!form.city.trim()) return "Please enter your city.";
    if (!form.state) return "Please select your state.";
    if (!form.dob) return "Please enter your date of birth.";
    if (!form.agreeTerms) return "You must agree to the Terms & Conditions and Privacy Policy.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) { setError(err); return; }
    setError("");
    setSubmitting(true);

    const result = await registerUser({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      city: form.city.trim(),
      state: form.state,
      dob: form.dob,
    });

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.needsVerification) {
      setStep("verify");
    } else {
      setStep("success");
      setTimeout(() => router.push("/dashboard"), 1500);
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
          className={`${styles.card} ${regStyles.wideCard}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}><Scale size={20} /></div>
            <span className={styles.logoText}>LawTalk</span>
          </div>

          <AnimatePresence mode="wait">
            {step === "form" && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className={styles.title}>Create Account</h1>
                <p className={styles.subtitle}>Join thousands of Indians getting expert legal help</p>

                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={regStyles.grid2}>
                    <div className="form-group">
                      <label className="form-label"><User size={12} /> Full Name *</label>
                      <input
                        id="reg-name"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Ramesh Kumar"
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label"><Mail size={12} /> Email Address *</label>
                      <input
                        id="reg-email"
                        type="email"
                        className="form-input"
                        placeholder="your@email.com"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label"><Lock size={12} /> Password *</label>
                      <div className={styles.passWrap}>
                        <input
                          id="reg-password"
                          type={showPass ? "text" : "password"}
                          className="form-input"
                          placeholder="Min. 8 chars, 1 uppercase, 1 number"
                          value={form.password}
                          onChange={(e) => update("password", e.target.value)}
                          autoComplete="new-password"
                        />
                        <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label"><Lock size={12} /> Confirm Password *</label>
                      <div className={styles.passWrap}>
                        <input
                          id="reg-confirm-password"
                          type={showConfirm ? "text" : "password"}
                          className="form-input"
                          placeholder="Repeat your password"
                          value={form.confirmPassword}
                          onChange={(e) => update("confirmPassword", e.target.value)}
                          autoComplete="new-password"
                        />
                        <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(v => !v)}>
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label"><Calendar size={12} /> Date of Birth *</label>
                      <input
                        id="reg-dob"
                        type="date"
                        className="form-input"
                        value={form.dob}
                        onChange={(e) => update("dob", e.target.value)}
                        max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label"><MapPin size={12} /> City *</label>
                      <input
                        id="reg-city"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Mumbai"
                        value={form.city}
                        onChange={(e) => update("city", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State *</label>
                      <select
                        id="reg-state"
                        className="form-select"
                        value={form.state}
                        onChange={(e) => update("state", e.target.value)}
                      >
                        <option value="">Select your state</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Terms */}
                  <label className={regStyles.termsLabel}>
                    <input
                      id="reg-terms"
                      type="checkbox"
                      checked={form.agreeTerms}
                      onChange={(e) => update("agreeTerms", e.target.checked)}
                      className={regStyles.checkbox}
                    />
                    <span>
                      I agree to the{" "}
                      <Link href="/terms" target="_blank" className={styles.switchLink}>Terms & Conditions</Link>
                      {" "}and{" "}
                      <Link href="/privacy" target="_blank" className={styles.switchLink}>Privacy Policy</Link>
                    </span>
                  </label>

                  {error && (
                    <div className={styles.error}>
                      <AlertCircle size={14} /> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                    disabled={submitting}
                    id="register-submit-btn"
                  >
                    {submitting ? <span className="spinner" /> : <>Create Account <ArrowRight size={16} /></>}
                  </button>

                  <p className={styles.switch}>
                    Already have an account?{" "}
                    <Link href="/login" className={styles.switchLink}>Sign In</Link>
                  </p>
                  <p className={styles.switch}>
                    Are you a lawyer?{" "}
                    <Link href="/lawyer/register" className={styles.switchLink}>Register as Lawyer</Link>
                  </p>
                </form>
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
                  <Mail size={48} color="var(--gold-400)" />
                </div>
                <h2>Verify Your Email</h2>
                <p style={{ textAlign: "center", lineHeight: 1.7 }}>
                  We&apos;ve sent a verification link to{" "}
                  <strong style={{ color: "var(--gold-400)" }}>{form.email}</strong>.
                  <br />
                  Please check your inbox and click the link to activate your account.
                </p>
                <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "var(--radius-md)", padding: "var(--space-4)", fontSize: "0.85rem", color: "var(--text-secondary)", textAlign: "left", marginTop: "var(--space-2)" }}>
                  <strong>⚠️ Important:</strong> Check your spam/junk folder if you don&apos;t see it within 2 minutes.
                  The link expires in 24 hours.
                </div>
                <Link href="/login" className="btn btn-primary" id="reg-verify-go-login" style={{ marginTop: "var(--space-4)" }}>
                  Go to Login
                </Link>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={styles.successState}>
                <div className={styles.successIcon}><CheckCircle size={40} color="var(--emerald)" /></div>
                <h2>Account Created!</h2>
                <p>Welcome to LawTalk! Redirecting to your dashboard...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
