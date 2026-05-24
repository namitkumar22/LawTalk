"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, IndianRupee, Clock, Star, ChevronRight, Wallet, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLawyers } from "@/context/LawyerContext";
import { supabase } from "@/utils/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "./page.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const { verifiedLawyers } = useLawyers();
  const [consultations, setConsultations] = useState([]);
  const [consultLoading, setConsultLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, loading, router]);

  // Fetch consultations from Supabase
  useEffect(() => {
    if (!user?.id) return;

    const fetchConsultations = async () => {
      const { data, error } = await supabase
        .from("consultations")
        .select(`
          id, status, total_charged, message_count, rating, started_at, ended_at,
          lawyers(id, name, specializations, price_per_chat)
        `)
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(10);

      if (!error) {
        setConsultations(data || []);
      }
      setConsultLoading(false);
    };

    fetchConsultations();

    // Real-time subscription for active consultations
    const channel = supabase
      .channel(`consultations-user-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "consultations",
        filter: `user_id=eq.${user.id}`,
      }, () => fetchConsultations())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  if (loading || !user) return null;

  const randomLawyers = verifiedLawyers.slice(0, 3);
  const totalSpent = consultations.reduce((s, c) => s + (c.total_charged || 0), 0);

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className="container">
          {/* Email not verified warning */}
          {!user.emailVerified && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "rgba(201,168,76,0.1)",
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-4)",
                marginBottom: "var(--space-6)",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                fontSize: "0.875rem",
              }}
            >
              <Mail size={16} color="var(--gold-400)" />
              <span style={{ color: "var(--text-secondary)" }}>
                Please verify your email address to unlock all features.{" "}
                <Link href="/login" style={{ color: "var(--gold-400)", fontWeight: 600 }}>Resend verification email</Link>
              </span>
            </motion.div>
          )}

          {/* Header */}
          <motion.div
            className={styles.header}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <h1 className={styles.greeting}>Good day, <span className="gradient-text">{user.name?.split(" ")[0]}</span> 👋</h1>
              <p style={{ color: "var(--text-muted)" }}>Manage your legal consultations and profile</p>
            </div>
            <Link href="/lawyers" className="btn btn-primary" id="dashboard-find-lawyer-btn">
              Find a Lawyer <ChevronRight size={16} />
            </Link>
          </motion.div>

          {/* Stats cards */}
          <div className={styles.statsGrid}>
            {[
              { icon: MessageSquare, label: "Total Consultations", value: consultations.length, color: "rgba(201,168,76,0.15)", iconColor: "var(--gold-400)" },
              { icon: IndianRupee, label: "Total Spent", value: `₹${totalSpent}`, color: "rgba(16,185,129,0.1)", iconColor: "var(--emerald)" },
              { icon: Wallet, label: "Wallet Balance", value: `₹${user.walletBalance || 0}`, color: "rgba(139,92,246,0.1)", iconColor: "var(--violet)" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className={styles.statCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={styles.statIcon} style={{ background: stat.color }}>
                  <stat.icon size={20} color={stat.iconColor} />
                </div>
                <div>
                  <p className={styles.statValue}>{stat.value}</p>
                  <p className={styles.statLabel}>{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className={styles.mainGrid}>
            {/* Recent Consultations */}
            <div>
              <h2 className={styles.sectionTitle}>Recent Consultations</h2>
              {consultLoading ? (
                <div className={styles.emptyState}>
                  <span className="spinner" />
                </div>
              ) : consultations.length === 0 ? (
                <div className={styles.emptyState}>
                  <MessageSquare size={40} color="var(--text-muted)" />
                  <p>No consultations yet</p>
                  <Link href="/lawyers" className="btn btn-primary btn-sm" id="dashboard-start-first-chat">
                    Start Your First Chat (₹2)
                  </Link>
                </div>
              ) : (
                <div className={styles.consultList}>
                  {consultations.map((c) => (
                    <div key={c.id} className={styles.consultCard}>
                      <div className={styles.consultInfo}>
                        <div className="avatar avatar-sm">
                          {c.lawyers?.name?.replace("Adv. ", "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "LA"}
                        </div>
                        <div>
                          <p className={styles.consultName}>{c.lawyers?.name || "Lawyer"}</p>
                          <p className={styles.consultDate}>{new Date(c.started_at).toLocaleDateString("en-IN")}</p>
                        </div>
                      </div>
                      <div className={styles.consultRight}>
                        <span className={`badge ${c.status === "active" ? "badge-green" : "badge-gray"}`}>{c.status}</span>
                        <span className={styles.consultCharge}>₹{c.total_charged || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile & Recommended */}
            <div>
              {/* Profile card */}
              <h2 className={styles.sectionTitle}>My Profile</h2>
              <div className={styles.profileCard}>
                <div className="avatar avatar-lg">{user.name?.slice(0, 2).toUpperCase()}</div>
                <div className={styles.profileInfo}>
                  <p className={styles.profileName}>{user.name}</p>
                  <p className={styles.profilePhone}>{user.email}</p>
                  {user.city && <p className={styles.profileCity}>{user.city}, {user.state}</p>}
                </div>
              </div>

              {/* Recommended lawyers */}
              <h2 className={styles.sectionTitle} style={{ marginTop: "var(--space-6)" }}>Recommended for You</h2>
              <div className={styles.recList}>
                {randomLawyers.map((l) => {
                  const initials = l.name.replace("Adv. ", "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div key={l.id} className={styles.recCard}>
                      <div className={styles.recLeft}>
                        <div className="avatar avatar-md">{initials}</div>
                        <div>
                          <p className={styles.recName}>{l.name}</p>
                          <p className={styles.recSpec}>{l.specializations[0]}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.78rem" }}>
                            <Star size={11} fill="var(--gold-400)" color="var(--gold-400)" />
                            <span style={{ color: "var(--gold-400)" }}>{l.rating}</span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/lawyers/${l.id}`} className="btn btn-primary btn-sm" id={`dashboard-rec-${l.id}`}>
                        ₹{l.pricePerMinute}/chat
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
