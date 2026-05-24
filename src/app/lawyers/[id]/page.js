"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Clock, MapPin, Globe, Shield, CheckCircle, IndianRupee,
  MessageSquare, ArrowLeft, AlertTriangle, X
} from "lucide-react";
import { useLawyers } from "@/context/LawyerContext";
import { useAuth } from "@/context/AuthContext";
import { FIRST_CHAT_PRICE } from "@/lib/constants";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "./page.module.css";

// Backend dev:
// GET /api/lawyers/:id — fetch lawyer profile
// Payment confirmation: POST /api/payments/initiate { amount: 2, lawyerId, userId }
// Integrate Razorpay / PhonePe / Paytm for payment
// After payment success: POST /api/chat/start { lawyerId, paymentId }

function ConfirmModal({ lawyer, onConfirm, onCancel }) {
  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="modal-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}>
            <MessageSquare size={24} color="var(--gold-400)" />
          </div>
          <button className={styles.modalClose} onClick={onCancel}><X size={18} /></button>
        </div>

        <h2 className={styles.modalTitle}>Start Consultation</h2>
        <p className={styles.modalDesc}>
          You're about to start a chat with <strong>{lawyer.name}</strong>
        </p>

        <div className={styles.paymentBox}>
          <div className={styles.payRow}>
            <span>First consultation fee</span>
            <span className={styles.payAmount}>₹{FIRST_CHAT_PRICE}</span>
          </div>
          <div className={styles.payRow} style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            <span>Subsequent charges</span>
            <span>₹{lawyer.pricePerMinute}/chat</span>
          </div>
          <div className={styles.payDivider} />
          <div className={styles.payRow}>
            <strong>Amount to pay now</strong>
            <strong className={styles.payTotal}>₹{FIRST_CHAT_PRICE}</strong>
          </div>
        </div>

        {/* Backend dev: Replace this button with Razorpay/PhonePe SDK integration */}
        {/* The payment gateway should return a payment_id which is then sent to POST /api/chat/start */}
        <div className={styles.payNote}>
          <AlertTriangle size={13} />
          Demo mode: No real payment is processed. In production, this will integrate with a payment gateway.
        </div>

        <div className={styles.modalActions}>
          <button className="btn btn-ghost" onClick={onCancel} id="chat-confirm-cancel">Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm} id="chat-confirm-pay" style={{ flex: 1 }}>
            <IndianRupee size={15} /> Pay ₹{FIRST_CHAT_PRICE} &amp; Start Chat
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function LawyerProfilePage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { getLawyerById } = useLawyers();
  const { user, isAuthenticated, deductBalance } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("about");

  const lawyer = getLawyerById(id);

  if (!lawyer) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
          <h2>Lawyer not found</h2>
          <Link href="/lawyers" className="btn btn-primary">Browse Lawyers</Link>
        </div>
        <Footer />
      </>
    );
  }

  const initials = lawyer.name.replace("Adv. ", "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const handleChatClick = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.role === "lawyer") {
      alert("Lawyers cannot chat with other lawyers through this interface.");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmChat = () => {
    // Backend dev: Initiate payment here → on success, create chat session
    // deductBalance is a mock for demo purposes
    deductBalance(FIRST_CHAT_PRICE);
    setShowConfirm(false);
    const sessionId = `${user.id}_${lawyer.id}_${Date.now()}`;
    router.push(`/chat/${sessionId}?lawyerId=${lawyer.id}`);
  };

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        {/* Back button */}
        <div className="container">
          <Link href="/lawyers" className={styles.backBtn}>
            <ArrowLeft size={16} /> Back to Lawyers
          </Link>
        </div>

        {/* Profile header */}
        <div className={styles.profileHeader}>
          <div className="container">
            <div className={styles.headerInner}>
              <div className={styles.headerLeft}>
                <div className={styles.avatarWrap}>
                  <div className="avatar avatar-xl">{initials}</div>
                  {lawyer.isOnline && (
                    <span className={styles.onlineBadge}>
                      <span className="online-dot" />
                    </span>
                  )}
                </div>
                <div className={styles.headerInfo}>
                  <div className={styles.verifiedRow}>
                    <h1 className={styles.name}>{lawyer.name}</h1>
                    <span className="badge badge-green"><CheckCircle size={11} /> Verified</span>
                  </div>
                  <p className={styles.specLine}>{lawyer.specializations.join(" · ")}</p>
                  <div className={styles.metaRow}>
                    <span className={styles.metaItem}><Star size={14} fill="var(--gold-400)" color="var(--gold-400)" />{lawyer.rating.toFixed(1)} ({lawyer.reviewCount} reviews)</span>
                    <span className={styles.metaItem}><Clock size={14} />{lawyer.experience} years experience</span>
                    <span className={styles.metaItem}><MapPin size={14} />{lawyer.city}, {lawyer.state}</span>
                    <span className={styles.metaItem}><Globe size={14} />{lawyer.languages.join(", ")}</span>
                  </div>
                  <div className={styles.statsRow}>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>{lawyer.totalConsultations.toLocaleString()}</span>
                      <span className={styles.statLabel}>Consultations</span>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.stat}>
                      <span className={styles.statValue}>{lawyer.rating.toFixed(1)}★</span>
                      <span className={styles.statLabel}>Rating</span>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.stat}>
                      <span className={styles.statValue}>{lawyer.experience}y</span>
                      <span className={styles.statLabel}>Experience</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Card */}
              <div className={styles.ctaCard}>
                <div className={styles.ctaPrice}>
                  <span className={styles.ctaPriceNum}><IndianRupee size={18} />{lawyer.pricePerMinute}</span>
                  <span className={styles.ctaPriceLabel}>per chat</span>
                </div>
                <div className={styles.ctaFirstChat}>
                  <Shield size={13} /> First chat only ₹{FIRST_CHAT_PRICE}
                </div>
                <button
                  className={`btn btn-primary ${styles.ctaBtn}`}
                  onClick={handleChatClick}
                  id="profile-start-chat-btn"
                >
                  <MessageSquare size={18} />
                  {isAuthenticated ? `Chat Now · ₹${FIRST_CHAT_PRICE}` : "Login to Chat"}
                </button>
                <p className={styles.ctaNote}>
                  {lawyer.isOnline
                    ? "🟢 Available now — typical response in 2 mins"
                    : "⚫ Currently offline — will respond when online"}
                </p>
                <div className={styles.barCouncil}>
                  <Shield size={12} /> Bar Council ID: {lawyer.barCouncilId}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="container">
          <div className={styles.tabs}>
            {["about", "specializations", "education"].map((tab) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ""}`}
                onClick={() => setActiveTab(tab)}
                id={`profile-tab-${tab}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className={styles.tabContent}>
            {activeTab === "about" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.aboutSection}>
                <h3>About</h3>
                <p className={styles.bio}>{lawyer.bio}</p>
                <div className={styles.infoGrid}>
                  <div className={styles.infoCard}>
                    <Globe size={16} />
                    <div>
                      <p className={styles.infoLabel}>Languages</p>
                      <p>{lawyer.languages.join(", ")}</p>
                    </div>
                  </div>
                  <div className={styles.infoCard}>
                    <MapPin size={16} />
                    <div>
                      <p className={styles.infoLabel}>Location</p>
                      <p>{lawyer.city}, {lawyer.state}</p>
                    </div>
                  </div>
                  <div className={styles.infoCard}>
                    <Clock size={16} />
                    <div>
                      <p className={styles.infoLabel}>Experience</p>
                      <p>{lawyer.experience} years</p>
                    </div>
                  </div>
                  <div className={styles.infoCard}>
                    <Shield size={16} />
                    <div>
                      <p className={styles.infoLabel}>Bar Council ID</p>
                      <p>{lawyer.barCouncilId}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "specializations" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className={styles.tabTitle}>Practice Areas</h3>
                <div className={styles.specGrid}>
                  {lawyer.specializations.map((s) => (
                    <div key={s} className={styles.specItem}>
                      <CheckCircle size={16} color="var(--gold-400)" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "education" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className={styles.tabTitle}>Education & Credentials</h3>
                <div className={styles.eduCard}>
                  <div className={styles.eduIcon}><Shield size={20} /></div>
                  <div>
                    <p className={styles.eduDegree}>{lawyer.education}</p>
                    <p className={styles.eduNote}>
                      All educational credentials have been verified by the LawTalk admin team.
                    </p>
                  </div>
                </div>
                <div className={styles.verifiedBox}>
                  <CheckCircle size={16} color="var(--emerald)" />
                  <div>
                    <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>Identity Verified</p>
                    <p style={{ fontSize: "0.82rem" }}>Bar council certificate and government ID verified by LawTalk admin team</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showConfirm && (
          <ConfirmModal
            lawyer={lawyer}
            onConfirm={handleConfirmChat}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}
