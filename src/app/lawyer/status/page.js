"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale, Clock, CheckCircle, XCircle, RefreshCw, Mail,
  Shield, FileText, Gavel, AlertCircle, ChevronRight, Phone
} from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "./page.module.css";

export default function LawyerApplicationStatusPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    }>
      <StatusPageInner />
    </Suspense>
  );
}

// Poll every 30 seconds for status changes
const POLL_INTERVAL = 30000;

function StatusPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lawyerIdFromUrl = searchParams.get("id");

  const [email, setEmail] = useState("");
  const [lawyerId, setLawyerId] = useState(lawyerIdFromUrl || "");
  const [status, setStatus] = useState(null); // null | 'pending' | 'verified' | 'rejected'
  const [lawyerData, setLawyerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastChecked, setLastChecked] = useState(null);
  const [looked, setLooked] = useState(false); // has user submitted the lookup form

  const checkStatus = useCallback(async (id, emailVal) => {
    setLoading(true);
    setError("");

    // Look up by lawyer ID (if available) or by email
    let query = supabase.from("lawyers").select("id, name, email, status, rejection_reason, created_at, specializations, city, state");
    if (id) {
      query = query.eq("id", id);
    } else if (emailVal) {
      query = query.eq("email", emailVal.toLowerCase().trim());
    } else {
      setError("Please enter your registered email address.");
      setLoading(false);
      return;
    }

    const { data, error: dbError } = await query.single();
    setLoading(false);
    setLastChecked(new Date());

    if (dbError || !data) {
      setError("No application found with that email. Please check and try again.");
      setStatus(null);
      return;
    }

    setLawyerData(data);
    setStatus(data.status);
    setLawyerId(data.id);
    setLooked(true);
  }, []);

  // Auto-poll when we have an ID
  useEffect(() => {
    if (!lawyerId) return;
    checkStatus(lawyerId, null);
    const t = setInterval(() => checkStatus(lawyerId, null), POLL_INTERVAL);
    return () => clearInterval(t);
  }, [lawyerId, checkStatus]);

  // If coming from registration with an ID in the URL
  useEffect(() => {
    if (lawyerIdFromUrl) {
      setLawyerId(lawyerIdFromUrl);
      setLooked(true);
    }
  }, [lawyerIdFromUrl]);

  const handleLookup = (e) => {
    e.preventDefault();
    checkStatus(null, email);
  };

  const statusConfig = {
    pending: {
      icon: Clock,
      iconColor: "var(--gold-400)",
      iconBg: "rgba(201,168,76,0.1)",
      badge: "Under Review",
      badgeClass: "badge-gold",
      title: "Application Under Review",
      description: "Our admin team is carefully reviewing your credentials and documents. This typically takes 24–48 hours on working days.",
      steps: [
        { label: "Application Submitted", done: true },
        { label: "Documents Under Review", done: true, active: true },
        { label: "Admin Verification", done: false },
        { label: "Account Activated", done: false },
      ],
    },
    verified: {
      icon: CheckCircle,
      iconColor: "var(--emerald)",
      iconBg: "rgba(16,185,129,0.1)",
      badge: "Approved",
      badgeClass: "badge-green",
      title: "Congratulations! You're Verified 🎉",
      description: "Your lawyer account has been approved. You can now log in and start accepting consultations from clients.",
      steps: [
        { label: "Application Submitted", done: true },
        { label: "Documents Reviewed", done: true },
        { label: "Admin Verified", done: true },
        { label: "Account Activated", done: true },
      ],
    },
    rejected: {
      icon: XCircle,
      iconColor: "#f87171",
      iconBg: "rgba(244,63,94,0.1)",
      badge: "Not Approved",
      badgeClass: "badge-red",
      title: "Application Not Approved",
      description: "Unfortunately, your application was not approved at this time. Please review the reason below and consider reapplying.",
      steps: [
        { label: "Application Submitted", done: true },
        { label: "Documents Reviewed", done: true },
        { label: "Admin Decision", done: true, rejected: true },
        { label: "Account Activated", done: false },
      ],
    },
  };

  const cfg = status ? statusConfig[status] : null;

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className="container">
          <div className={styles.inner}>

            {/* Header */}
            <motion.div className={styles.header} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className={styles.logoRow}>
                <div className={styles.logoIcon}><Scale size={18} /></div>
                <span className={styles.logoText}>LawTalk</span>
              </div>
              <h1 className={styles.title}>Application Status</h1>
              <p className={styles.subtitle}>Track your lawyer registration application in real-time</p>
            </motion.div>

            {/* Lookup form — shown if no ID in URL */}
            {!lawyerIdFromUrl && !looked && (
              <motion.div
                className={styles.lookupCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className={styles.lookupIcon}><Mail size={28} color="var(--gold-400)" /></div>
                <h2 className={styles.lookupTitle}>Check Your Status</h2>
                <p className={styles.lookupSub}>Enter the email address you used during registration</p>
                <form onSubmit={handleLookup} className={styles.lookupForm}>
                  <input
                    id="status-email-input"
                    type="email"
                    className="form-input"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  {error && (
                    <p className={styles.lookupError}><AlertCircle size={13} /> {error}</p>
                  )}
                  <button type="submit" className="btn btn-primary" disabled={loading} id="status-lookup-btn" style={{ width: "100%", justifyContent: "center" }}>
                    {loading ? <span className="spinner" /> : <><FileText size={15} /> Check Status</>}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Loading */}
            {loading && !lawyerData && (
              <div className={styles.loadingState}>
                <span className="spinner" style={{ width: 32, height: 32 }} />
                <p>Looking up your application…</p>
              </div>
            )}

            {/* Status result */}
            <AnimatePresence>
              {cfg && lawyerData && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className={styles.resultWrap}
                >
                  {/* Status card */}
                  <div className={styles.statusCard}>
                    {/* Lawyer info header */}
                    <div className={styles.lawyerHeader}>
                      <div className="avatar avatar-xl" style={{ fontSize: "1.2rem" }}>
                        {lawyerData.name?.replace("Adv. ", "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className={styles.lawyerName}>{lawyerData.name}</p>
                        <p className={styles.lawyerEmail}>{lawyerData.email}</p>
                        <p className={styles.lawyerMeta}>
                          {(lawyerData.specializations || []).slice(0, 2).join(" · ")}
                          {lawyerData.city ? ` · ${lawyerData.city}, ${lawyerData.state}` : ""}
                        </p>
                      </div>
                      <span className={`badge ${cfg.badgeClass}`} style={{ marginLeft: "auto", alignSelf: "flex-start" }}>
                        {status === "pending" ? <Clock size={11} /> : status === "verified" ? <CheckCircle size={11} /> : <XCircle size={11} />}
                        {cfg.badge}
                      </span>
                    </div>

                    <div className={styles.divider} />

                    {/* Status icon + message */}
                    <div className={styles.statusBody}>
                      <div className={styles.statusIconWrap} style={{ background: cfg.iconBg }}>
                        <cfg.icon size={36} color={cfg.iconColor} />
                      </div>
                      <h2 className={styles.statusTitle}>{cfg.title}</h2>
                      <p className={styles.statusDesc}>{cfg.description}</p>

                      {/* Rejection reason */}
                      {status === "rejected" && lawyerData.rejection_reason && (
                        <div className={styles.rejectionBox}>
                          <p className={styles.rejectionLabel}>Reason from admin:</p>
                          <p className={styles.rejectionText}>{lawyerData.rejection_reason}</p>
                        </div>
                      )}
                    </div>

                    {/* Progress tracker */}
                    <div className={styles.progressSection}>
                      <p className={styles.progressLabel}>Application Progress</p>
                      <div className={styles.steps}>
                        {cfg.steps.map((step, i) => (
                          <div key={step.label} className={styles.stepItem}>
                            <div className={`${styles.stepCircle} ${step.done ? (step.rejected ? styles.stepRejected : styles.stepDone) : ""} ${step.active ? styles.stepActive : ""}`}>
                              {step.done && !step.active && !step.rejected ? (
                                <CheckCircle size={14} />
                              ) : step.rejected ? (
                                <XCircle size={14} />
                              ) : step.active ? (
                                <span className={styles.stepPulse} />
                              ) : (
                                <span className={styles.stepNum}>{i + 1}</span>
                              )}
                            </div>
                            {i < cfg.steps.length - 1 && (
                              <div className={`${styles.stepLine} ${step.done && !step.active ? styles.stepLineDone : ""}`} />
                            )}
                            <p className={`${styles.stepLabel} ${step.done ? styles.stepLabelDone : ""} ${step.active ? styles.stepLabelActive : ""}`}>
                              {step.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={styles.actions}>
                      {status === "verified" && (
                        <Link href="/lawyer/login" className="btn btn-primary" id="status-goto-login" style={{ flex: 1, justifyContent: "center" }}>
                          <Gavel size={15} /> Login to Your Account
                        </Link>
                      )}
                      {status === "rejected" && (
                        <Link href="/lawyer/register" className="btn btn-primary" id="status-reapply" style={{ flex: 1, justifyContent: "center" }}>
                          Reapply <ChevronRight size={15} />
                        </Link>
                      )}
                      <button
                        className="btn btn-ghost"
                        onClick={() => checkStatus(lawyerId, null)}
                        disabled={loading}
                        id="status-refresh-btn"
                      >
                        <RefreshCw size={14} className={loading ? styles.spinning : ""} /> Refresh
                      </button>
                    </div>

                    {/* Last checked */}
                    {lastChecked && (
                      <p className={styles.lastChecked}>
                        Last checked: {lastChecked.toLocaleTimeString("en-IN")} · Auto-refreshes every 30 seconds
                      </p>
                    )}
                  </div>

                  {/* Info cards */}
                  {status === "pending" && (
                    <div className={styles.infoGrid}>
                      <div className={styles.infoCard}>
                        <Clock size={18} color="var(--gold-400)" />
                        <div>
                          <p className={styles.infoTitle}>Processing Time</p>
                          <p className={styles.infoText}>Applications are typically reviewed within 24–48 business hours.</p>
                        </div>
                      </div>
                      <div className={styles.infoCard}>
                        <Mail size={18} color="var(--emerald)" />
                        <div>
                          <p className={styles.infoTitle}>Email Notification</p>
                          <p className={styles.infoText}>You'll receive an email once a decision is made on your application.</p>
                        </div>
                      </div>
                      <div className={styles.infoCard}>
                        <Phone size={18} color="var(--violet)" />
                        <div>
                          <p className={styles.infoTitle}>Need Help?</p>
                          <p className={styles.infoText}>Contact us at <a href="mailto:support.lawtalk@gmail.com" style={{ color: "var(--gold-400)" }}>support.lawtalk@gmail.com</a></p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Check another / back link */}
            {looked && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ textAlign: "center", marginTop: "var(--space-6)" }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setLooked(false); setStatus(null); setLawyerData(null); setEmail(""); setLawyerId(""); setError(""); }}
                  id="status-check-another"
                >
                  ← Check another application
                </button>
              </motion.div>
            )}

          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
