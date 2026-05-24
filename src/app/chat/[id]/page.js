"use client";

import { use, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, IndianRupee, AlertTriangle, Star } from "lucide-react";
import { useLawyers } from "@/context/LawyerContext";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/hooks/useChat";
import Navbar from "@/components/layout/Navbar";
import styles from "./page.module.css";

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
            {[1,2,3,4,5].map((s) => (
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
    await endSession(rating);
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
            {sessionActive && (
              <button className="btn btn-danger btn-sm" onClick={() => setShowEndModal(true)} id="chat-end-session-btn">
                <X size={14} /> End Session
              </button>
            )}
          </div>
        </div>

        {/* First message banner */}
        {messages.length === 0 && sessionActive && (
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
                placeholder="Type your legal question..."
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
              <button className="btn btn-primary" onClick={() => router.push("/lawyers")} id="chat-find-another-btn">
                Find Another Lawyer
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showEndModal && (
          <EndSessionModal
            totalCharged={totalCharged}
            onConfirm={handleEndSession}
            onCancel={() => setShowEndModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
