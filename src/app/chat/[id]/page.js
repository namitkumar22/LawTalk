"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, IndianRupee, AlertTriangle, Star, Flag, Clock, Shield } from "lucide-react";
import { useLawyers } from "@/context/LawyerContext";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/hooks/useChat";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/utils/supabase/client";
import styles from "./page.module.css";

// ── Modals ──────────────────────────────────────────────────

function EndSessionModal({ totalCharged, onConfirm, onCancel }) {
  const [rating, setRating] = useState(0);
  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}>
      <motion.div className="modal-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: "var(--space-2)" }}>End Consultation?</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-5)" }}>
          Total charged: <strong style={{ color: "var(--gold-400)" }}>₹{totalCharged}</strong>
        </p>
        <div style={{ marginBottom: "var(--space-5)" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "var(--space-3)" }}>Rate your experience (optional)</p>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <Star size={28} fill={s <= rating ? "var(--gold-400)" : "transparent"} color="var(--gold-400)" />
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <button className="btn btn-ghost" onClick={onCancel} id="chat-end-cancel">Cancel</button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => onConfirm(rating)} id="chat-end-confirm">End Session</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ReportModal({ lawyerName, consultationId, reporterId, lawyerId, onClose }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const REASONS = [
    "Lawyer ended chat without completing consultation",
    "Lawyer demanded extra payment outside the platform",
    "Inappropriate or offensive behavior",
    "Gave wrong / harmful legal advice",
    "Did not respond after payment",
    "Other",
  ];

  const handleSubmit = async () => {
    if (!reason || !description.trim()) {
      setError("Please select a reason and provide details.");
      return;
    }
    if (description.trim().length < 20) {
      setError("Please provide more details (min. 20 characters).");
      return;
    }
    setSubmitting(true);
    setError("");
    const { data, error: rpcErr } = await supabase.rpc("submit_report", {
      p_reporter_id: reporterId,
      p_lawyer_id: lawyerId,
      p_consultation_id: consultationId,
      p_reason: reason,
      p_description: description.trim(),
    });
    setSubmitting(false);
    if (rpcErr || !data?.success) {
      setError("Failed to submit report. Please try again.");
    } else {
      setDone(true);
    }
  };

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="modal-content"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520 }}
      >
        {done ? (
          <div style={{ textAlign: "center", padding: "var(--space-4)" }}>
            <Shield size={48} color="var(--emerald)" style={{ margin: "0 auto 1rem", display: "block" }} />
            <h3>Report Submitted</h3>
            <p style={{ color: "var(--text-muted)", margin: "0.75rem 0 1.5rem", lineHeight: 1.6 }}>
              Your report has been received and automatically assigned to an admin for review.
              We take all reports seriously and will respond within <strong>24–48 hours</strong>.
            </p>
            <button className="btn btn-primary" onClick={onClose} id="report-done-btn" style={{ width: "100%", justifyContent: "center" }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-5)" }}>
              <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Flag size={20} color="#f87171" /> Report {lawyerName}
              </h2>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Reason for report *</label>
              <select
                className="form-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                id="report-reason"
              >
                <option value="">Select a reason…</option>
                {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Details * (min. 20 characters)</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Describe what happened in detail. The more information you provide, the better we can help."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                id="report-description"
              />
              <span style={{ fontSize: "0.75rem", color: description.length < 20 ? "var(--text-muted)" : "var(--emerald)" }}>
                {description.length}/20 min characters
              </span>
            </div>

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#f87171", fontSize: "0.85rem", marginBottom: "var(--space-4)" }}>
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              <button className="btn btn-ghost" onClick={onClose} id="report-cancel-btn">Cancel</button>
              <button
                className="btn btn-danger"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={handleSubmit}
                disabled={submitting}
                id="report-submit-btn"
              >
                {submitting ? <span className="spinner" /> : <><Flag size={14} /> Submit Report</>}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Main Chat Page ───────────────────────────────────────────

export default function ChatPage({ params }) {
  const { id: consultationId } = use(params);
  const searchParams = useSearchParams();
  const lawyerId = searchParams.get("lawyerId");
  const router = useRouter();

  const { user, isAuthenticated, deductBalance } = useAuth();
  const { getLawyerById, updateLawyer } = useLawyers();
  const { messages, isTyping, sessionActive, totalCharged, loading, sendMessage, startSession, endSession } = useChat(consultationId);

  const lawyer = getLawyerById(lawyerId);
  const [input, setInput] = useState("");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null); // minutes until auto-expire
  const messagesEndRef = useRef(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (!lawyer && !loading) { router.push("/lawyers"); return; }
  }, [isAuthenticated, lawyer, loading, router]);

  // Start session on mount
  useEffect(() => {
    if (user && lawyer && !sessionStarted && !loading) {
      startSession(user.id, lawyer.id, lawyer.name);
      setSessionStarted(true);
    }
  }, [user, lawyer, sessionStarted, loading, startSession]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Check remaining time (24h window) — poll every minute
  useEffect(() => {
    if (!consultationId || !sessionActive) return;

    const checkExpiry = async () => {
      const { data } = await supabase
        .from("consultations")
        .select("auto_expires_at")
        .eq("id", consultationId)
        .single();

      if (data?.auto_expires_at) {
        const diffMs = new Date(data.auto_expires_at) - Date.now();
        const diffMin = Math.floor(diffMs / 60000);
        setTimeLeft(diffMin > 0 ? diffMin : 0);
      }
    };

    checkExpiry();
    const t = setInterval(checkExpiry, 60000);
    return () => clearInterval(t);
  }, [consultationId, sessionActive]);

  const handleSend = async () => {
    if (!input.trim() || !sessionActive || !user) return;
    const isFirst = messages.length === 0;
    const { charged, error } = await sendMessage(
      input.trim(),
      "user",
      user.id,
      isFirst,
      lawyer?.pricePerMinute || 30
    );
    if (charged > 0 && !error) {
      await deductBalance(charged, consultationId);
    }
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleEndSession = async (rating) => {
    // Use the secure RPC which records who ended the session
    await supabase.rpc("end_consultation", {
      p_consultation_id: consultationId,
      p_actor_id: user.id,
      p_actor_type: "user",
      p_rating: rating || null,
    });
    await endSession(rating); // update local state
    setShowEndModal(false);
    if (rating > 0 && lawyer) {
      const newRating = ((lawyer.rating * lawyer.reviewCount) + rating) / (lawyer.reviewCount + 1);
      await updateLawyer(lawyer.id, { rating: +newRating.toFixed(1), reviewCount: lawyer.reviewCount + 1 });
    }
    router.push("/dashboard");
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const initials = lawyer?.name?.replace("Adv. ", "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "LA";

  if (!lawyer || !isAuthenticated) return null;

  // Show warning when < 60 minutes left
  const showExpiryWarning = timeLeft !== null && timeLeft < 60 && sessionActive;

  return (
    <>
      <div className={styles.chatPage}>
        {/* Chat header */}
        <div className={styles.chatHeader}>
          <div className={styles.headerLeft}>
            <button className={styles.backBtn} onClick={() => router.push(`/lawyers/${lawyerId}`)} aria-label="Back">←</button>
            <div className={`avatar avatar-md ${styles.avatar}`}>{initials}</div>
            <div className={styles.headerInfo}>
              <p className={styles.lawyerName}>{lawyer.name}</p>
              <div className={styles.lawyerStatus}>
                {sessionActive ? (
                  <><span className="online-dot" style={{ width: 6, height: 6 }} /> Active session</>
                ) : "Session ended"}
              </div>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.chargeDisplay}>
              <IndianRupee size={13} />
              <span>{totalCharged}</span>
              <span className={styles.chargeLabel}>charged</span>
            </div>
            {/* Report button — always visible */}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowReportModal(true)}
              id="chat-report-btn"
              title="Report this lawyer"
              style={{ color: "#f87171" }}
            >
              <Flag size={14} /> Report
            </button>
            {sessionActive && (
              <button className="btn btn-danger btn-sm" onClick={() => setShowEndModal(true)} id="chat-end-session-btn">
                <X size={14} /> End Session
              </button>
            )}
          </div>
        </div>

        {/* Auto-expiry warning */}
        {showExpiryWarning && (
          <motion.div
            className={styles.firstMsgBanner}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: "rgba(244,63,94,0.1)", borderColor: "rgba(244,63,94,0.3)", color: "#f87171" }}
          >
            <Clock size={14} />
            Session auto-closes in {timeLeft < 1 ? "less than a minute" : `${timeLeft} minutes`}. End it manually before time runs out.
          </motion.div>
        )}

        {/* First message banner */}
        {messages.length === 0 && sessionActive && !showExpiryWarning && (
          <motion.div className={styles.firstMsgBanner} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <IndianRupee size={14} />
            Your first message is only ₹2. After that, charges are ₹{lawyer.pricePerMinute}/chat.
          </motion.div>
        )}

        {/* Session ended banner */}
        {!sessionActive && messages.length > 0 && (
          <div className={styles.endedBanner}>
            <AlertTriangle size={14} />
            This session has ended. Total charged: ₹{totalCharged}
            {" · "}
            <button
              style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "0.82rem", padding: 0 }}
              onClick={() => setShowReportModal(true)}
              id="chat-report-after-end-btn"
            >
              <Flag size={12} /> Report an issue
            </button>
          </div>
        )}

        {/* Messages */}
        <div className={styles.messages}>
          {loading && (
            <div className={styles.emptyState}>
              <span className="spinner" />
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className={styles.emptyState}>
              <div className="avatar avatar-xl" style={{ margin: "0 auto var(--space-4)" }}>{initials}</div>
              <h3>{lawyer.name}</h3>
              <p>{lawyer.specializations.slice(0, 2).join(" · ")}</p>
              <p className={styles.emptyHint}>Send your first message to start the consultation (₹2)</p>
            </div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              className={`${styles.msgWrapper} ${msg.sender === "user" ? styles.msgWrapperRight : styles.msgWrapperLeft}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {msg.sender === "lawyer" && (
                <div className={`avatar avatar-sm ${styles.msgAvatar}`}>{initials}</div>
              )}
              <div className={styles.msgBubble}>
                <div className={msg.sender === "user" ? "chat-bubble-user" : "chat-bubble-lawyer"}>
                  {msg.content}
                </div>
                <div className={styles.msgMeta}>
                  <span>{formatTime(msg.timestamp)}</span>
                  {msg.charge > 0 && (
                    <span className={styles.msgCharge}><IndianRupee size={10} />{msg.charge} charged</span>
                  )}
                </div>
              </div>
              {msg.sender === "user" && (
                <div className={`avatar avatar-sm ${styles.msgAvatarUser}`}>
                  {user?.name?.slice(0, 2).toUpperCase() || "U"}
                </div>
              )}
            </motion.div>
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                className={`${styles.msgWrapper} ${styles.msgWrapperLeft}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className={`avatar avatar-sm`}>{initials}</div>
                <div className={styles.typingBubble}>
                  <span /><span /><span />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className={styles.inputArea}>
          {sessionActive ? (
            <div className={styles.inputRow}>
              <textarea
                id="chat-input"
                className={styles.chatInput}
                placeholder="Type your legal question…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={!input.trim()}
                id="chat-send-btn"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          ) : (
            <div className={styles.sessionEndedInput}>
              <p>Session has ended.</p>
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <button className="btn btn-ghost" onClick={() => setShowReportModal(true)} id="chat-report-ended-btn" style={{ color: "#f87171" }}>
                  <Flag size={14} /> Report Issue
                </button>
                <button className="btn btn-primary" onClick={() => router.push("/lawyers")} id="chat-find-another-btn">
                  Find Another Lawyer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showEndModal && (
          <EndSessionModal
            totalCharged={totalCharged}
            onConfirm={handleEndSession}
            onCancel={() => setShowEndModal(false)}
          />
        )}
        {showReportModal && user && lawyer && (
          <ReportModal
            lawyerName={lawyer.name}
            consultationId={consultationId}
            reporterId={user.id}
            lawyerId={lawyer.id}
            onClose={() => setShowReportModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
