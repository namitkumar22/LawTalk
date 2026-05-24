"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Clock, IndianRupee, Users, AlertCircle, CheckCircle, Shield, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLawyers } from "@/context/LawyerContext";
import { supabase } from "@/utils/supabase/client";
import { LAWYER_STATUS } from "@/lib/constants";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "./page.module.css";

export default function LawyerDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const { getLawyerById, toggleOnlineStatus } = useLawyers();
  const [isOnline, setIsOnline] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [consultLoading, setConsultLoading] = useState(true);
  const [lawyerData, setLawyerData] = useState(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
    if (!loading && isAuthenticated && user?.role !== "lawyer") router.push("/dashboard");
  }, [isAuthenticated, loading, user, router]);

  // Load lawyer data from Supabase directly
  useEffect(() => {
    if (!user?.id) return;

    const fetchLawyerData = async () => {
      const { data, error } = await supabase
        .from("lawyers")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setLawyerData(data);
        setIsOnline(data.is_online || false);
      }
    };

    const fetchConsultations = async () => {
      const { data, error } = await supabase
        .from("consultations")
        .select(`
          id, status, total_charged, message_count, rating, started_at, ended_at,
          profiles(name, email)
        `)
        .eq("lawyer_id", user.id)
        .order("started_at", { ascending: false })
        .limit(20);

      if (!error) setConsultations(data || []);
      setConsultLoading(false);
    };

    fetchLawyerData();
    fetchConsultations();
  }, [user?.id]);

  if (loading || !user) return null;

  const totalEarnings = consultations.reduce((s, c) => s + (c.total_charged || 0), 0);
  const initials = user.name?.replace("Adv. ", "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "LA";
  const ld = lawyerData || {};

  const status = ld.status || user.status;
  const isPending = status === LAWYER_STATUS.PENDING;
  const isRejected = status === LAWYER_STATUS.REJECTED;
  const isVerified = status === LAWYER_STATUS.VERIFIED;

  const handleToggleOnline = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    await toggleOnlineStatus(user.id, newStatus);
  };

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className="container">
          {/* Status banners */}
          {isPending && (
            <div className={styles.pendingBanner}>
              <Clock size={16} />
              <div>
                <strong>Application Under Review</strong>
                <p>Our admin team is reviewing your credentials. This typically takes 24–48 hours.</p>
              </div>
            </div>
          )}
          {isRejected && (
            <div className={styles.rejectedBanner}>
              <AlertCircle size={16} />
              <div>
                <strong>Application Rejected</strong>
                <p>Reason: {ld.rejection_reason || "Please contact support for more details."}</p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className={styles.header}>
            <div className={styles.profileRow}>
              <div className="avatar avatar-xl">{initials}</div>
              <div>
                <h1 className={styles.name}>{user.name}</h1>
                <p className={styles.specs}>{(ld.specializations || []).slice(0, 2).join(" · ")}</p>
                <div className={styles.tags}>
                  {isVerified && <span className="badge badge-green"><CheckCircle size={11} /> Verified</span>}
                  {isPending && <span className="badge badge-gold"><Clock size={11} /> Pending Verification</span>}
                  {isRejected && <span className="badge badge-red"><AlertCircle size={11} /> Rejected</span>}
                  {ld.city && <span className={styles.city}>{ld.city}, {ld.state}</span>}
                </div>
              </div>
            </div>

            {/* Online toggle */}
            {isVerified && (
              <div className={styles.toggleWrap}>
                <span className={styles.toggleLabel}>Status:</span>
                <button
                  className={`${styles.toggle} ${isOnline ? styles.toggleOn : styles.toggleOff}`}
                  onClick={handleToggleOnline}
                  id="lawyer-dashboard-toggle-online"
                >
                  <span className={styles.toggleKnob} />
                  <span className={styles.toggleText}>{isOnline ? "Online" : "Offline"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className={styles.statsGrid}>
            {[
              { icon: MessageSquare, label: "Consultations", value: consultations.length, color: "rgba(201,168,76,0.15)", iconColor: "var(--gold-400)" },
              { icon: IndianRupee, label: "Total Earnings", value: `₹${totalEarnings}`, color: "rgba(16,185,129,0.1)", iconColor: "var(--emerald)" },
              { icon: Star, label: "Rating", value: ld.rating ? `${Number(ld.rating).toFixed(1)}★` : "N/A", color: "rgba(139,92,246,0.1)", iconColor: "var(--violet)" },
              { icon: IndianRupee, label: "My Rate", value: `₹${ld.price_per_chat || 30}/chat`, color: "rgba(56,189,248,0.1)", iconColor: "var(--sky)" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className={styles.statCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={styles.statIcon} style={{ background: s.color }}>
                  <s.icon size={20} color={s.iconColor} />
                </div>
                <div>
                  <p className={styles.statValue}>{s.value}</p>
                  <p className={styles.statLabel}>{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className={styles.mainGrid}>
            {/* Recent Consultations */}
            <div>
              <h2 className={styles.sectionTitle}>Recent Consultations</h2>
              {consultLoading ? (
                <div className={styles.emptyState}><span className="spinner" /></div>
              ) : consultations.length === 0 ? (
                <div className={styles.emptyState}>
                  <MessageSquare size={36} color="var(--text-muted)" />
                  <p>No consultations yet.</p>
                  {!isVerified && <p style={{ fontSize: "0.8rem" }}>Your profile will appear to users once verified by admin.</p>}
                </div>
              ) : (
                <div className={styles.consultList}>
                  {consultations.map((c) => (
                    <div key={c.id} className={styles.consultCard}>
                      <div className="avatar avatar-sm">
                        {c.profiles?.name?.slice(0, 2).toUpperCase() || "US"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
                          {c.profiles?.name || "User Consultation"}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {new Date(c.started_at).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className={`badge ${c.status === "active" ? "badge-green" : "badge-gray"}`} style={{ fontSize: "0.7rem" }}>{c.status}</span>
                        <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--gold-400)", marginTop: 4 }}>₹{c.total_charged || 0}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile Summary */}
            <div>
              <h2 className={styles.sectionTitle}>My Profile</h2>
              <div className={styles.profileCard}>
                <div className={styles.profileItem}><Shield size={14} /><span className={styles.piLabel}>Bar Council ID</span><span className={styles.piVal}>{ld.bar_council_id || "—"}</span></div>
                <div className={styles.profileItem}><Users size={14} /><span className={styles.piLabel}>Specializations</span><span className={styles.piVal}>{(ld.specializations || []).join(", ") || "—"}</span></div>
                <div className={styles.profileItem}><Clock size={14} /><span className={styles.piLabel}>Experience</span><span className={styles.piVal}>{ld.experience || 0} years</span></div>
                <div className={styles.profileItem}><IndianRupee size={14} /><span className={styles.piLabel}>Rate</span><span className={styles.piVal}>₹{ld.price_per_chat || 30}/chat</span></div>
              </div>

              <div className={styles.quickLinks}>
                <Link href="/lawyers" className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center" }} id="lawyer-dash-view-profile">
                  View Public Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
