"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare, IndianRupee, Clock, Star, ChevronRight,
  Wallet, Mail, Plus, ArrowUpRight, Search, Zap, Shield,
  TrendingUp, CheckCircle, XCircle, Activity
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLawyers } from "@/context/LawyerContext";
import { supabase } from "@/utils/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "./page.module.css";

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 24 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] } }),
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const { verifiedLawyers } = useLawyers();
  const [consultations, setConsultations] = useState([]);
  const [consultLoading, setConsultLoading] = useState(true);
  const [greeting, setGreeting] = useState("Good day");

  // Time-based greeting
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/login");
  }, [isAuthenticated, loading, router]);

  // Redirect lawyers to their own dashboard
  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === "lawyer") {
      router.replace("/lawyer/dashboard");
    }
  }, [isAuthenticated, loading, user, router]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchConsultations = async () => {
      const { data, error } = await supabase
        .from("consultations")
        .select(`id, status, total_charged, message_count, rating, started_at, ended_at,
          lawyers(id, name, specializations, price_per_chat)`)
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(10);
      if (!error) setConsultations(data || []);
      setConsultLoading(false);
    };
    fetchConsultations();
    const channel = supabase
      .channel(`consultations-user-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "consultations", filter: `user_id=eq.${user.id}` },
        () => fetchConsultations())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  if (loading || !user) return null;

  const totalSpent = consultations.reduce((s, c) => s + (c.total_charged || 0), 0);
  const activeConsult = consultations.find((c) => c.status === "active");
  const completedCount = consultations.filter((c) => c.status === "completed").length;
  const avgRating = consultations.filter((c) => c.rating).reduce((s, c, _, a) => s + c.rating / a.length, 0);
  const recommendedLawyers = verifiedLawyers.slice(0, 4);

  const stats = [
    {
      icon: MessageSquare, label: "Consultations", value: consultations.length,
      sub: `${completedCount} completed`, color: "rgba(201,168,76,0.12)", iconColor: "var(--gold-400)",
      href: null,
    },
    {
      icon: IndianRupee, label: "Total Spent", value: `₹${totalSpent}`,
      sub: "lifetime", color: "rgba(16,185,129,0.1)", iconColor: "var(--emerald)",
      href: null,
    },
    {
      icon: Wallet, label: "Wallet Balance", value: `₹${user.walletBalance ?? 0}`,
      sub: "Add funds", color: "rgba(139,92,246,0.12)", iconColor: "var(--violet)",
      href: "/dashboard",
    },
    {
      icon: Star, label: "Avg. Rating Given", value: avgRating ? avgRating.toFixed(1) + "★" : "—",
      sub: `${consultations.filter(c => c.rating).length} rated`, color: "rgba(56,189,248,0.1)", iconColor: "var(--sky)",
      href: null,
    },
  ];

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className="container">

          {/* Email verification banner */}
          {!user.emailVerified && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className={styles.verifyBanner}
            >
              <Mail size={16} color="var(--gold-400)" />
              <span>
                Verify your email to unlock all features.{" "}
                <Link href="/auth/verify" className={styles.bannerLink}>Go to verification →</Link>
              </span>
            </motion.div>
          )}

          {/* Active consultation alert */}
          {activeConsult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className={styles.activeBanner}
            >
              <Activity size={15} />
              <span>You have an <strong>active consultation</strong> in progress.</span>
              <Link
                href={`/chat/${activeConsult.id}?lawyerId=${activeConsult.lawyers?.id}`}
                className="btn btn-primary btn-sm"
                id="dashboard-resume-chat"
              >
                Resume Chat <ArrowUpRight size={13} />
              </Link>
            </motion.div>
          )}

          {/* Header */}
          <div className={styles.header}>
            <div>
              <p className={styles.greetSub}>Welcome back</p>
              <h1 className={styles.greeting}>
                {greeting}, <span className="gradient-text">{user.name?.split(" ")[0]}</span> 👋
              </h1>
              <p className={styles.headerSub}>
                {consultations.length === 0
                  ? "Start your first legal consultation for just ₹2"
                  : `You've had ${consultations.length} consultation${consultations.length !== 1 ? "s" : ""} so far`}
              </p>
            </div>
            <Link href="/lawyers" className="btn btn-primary" id="dashboard-find-lawyer-btn">
              <Search size={16} /> Find a Lawyer
            </Link>
          </div>

          {/* Stats grid */}
          <div className={styles.statsGrid}>
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                className={`${styles.statCard} ${s.href ? styles.statCardClickable : ""}`}
                custom={i} initial="hidden" animate="show" variants={CARD_VARIANTS}
                onClick={s.href ? () => router.push(s.href) : undefined}
              >
                <div className={styles.statTop}>
                  <div className={styles.statIcon} style={{ background: s.color }}>
                    <s.icon size={20} color={s.iconColor} />
                  </div>
                  {s.href && <ArrowUpRight size={14} className={styles.statArrow} />}
                </div>
                <p className={styles.statValue}>{s.value}</p>
                <p className={styles.statLabel}>{s.label}</p>
                <p className={styles.statSub}>{s.sub}</p>
              </motion.div>
            ))}
          </div>

          <div className={styles.mainGrid}>
            {/* Left column */}
            <div>
              {/* Recent consultations */}
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Recent Consultations</h2>
                  {consultations.length > 0 && (
                    <span className={styles.sectionCount}>{consultations.length}</span>
                  )}
                </div>

                {consultLoading ? (
                  <div className={styles.emptyState}><span className="spinner" /></div>
                ) : consultations.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}><MessageSquare size={28} /></div>
                    <p className={styles.emptyTitle}>No consultations yet</p>
                    <p className={styles.emptySub}>Your first consultation is just ₹2</p>
                    <Link href="/lawyers" className="btn btn-primary" id="dashboard-start-first-chat">
                      Find a Lawyer <ChevronRight size={15} />
                    </Link>
                  </div>
                ) : (
                  <div className={styles.consultList}>
                    {consultations.map((c, i) => {
                      const initials = c.lawyers?.name?.replace("Adv. ", "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "LA";
                      return (
                        <motion.div
                          key={c.id} className={styles.consultCard}
                          custom={i} initial="hidden" animate="show" variants={CARD_VARIANTS}
                        >
                          <div className={styles.consultLeft}>
                            <div className={`avatar avatar-md ${styles.consultAvatar} ${c.status === "active" ? styles.consultAvatarActive : ""}`}>
                              {initials}
                            </div>
                            <div>
                              <p className={styles.consultName}>{c.lawyers?.name || "Lawyer"}</p>
                              <p className={styles.consultSpec}>{(c.lawyers?.specializations || [])[0] || ""}</p>
                              <p className={styles.consultDate}>
                                {new Date(c.started_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                          </div>
                          <div className={styles.consultRight}>
                            <span className={`badge ${c.status === "active" ? "badge-green" : c.status === "completed" ? "badge-gray" : "badge"}`}>
                              {c.status === "active" ? <><Activity size={10} /> Active</> : c.status === "completed" ? <><CheckCircle size={10} /> Done</> : c.status}
                            </span>
                            <p className={styles.consultCharge}>₹{c.total_charged || 0}</p>
                            {c.rating && (
                              <div className={styles.consultRating}>
                                <Star size={10} fill="var(--gold-400)" color="var(--gold-400)" />
                                <span>{c.rating}</span>
                              </div>
                            )}
                            {c.status === "active" && c.lawyers?.id && (
                              <Link
                                href={`/chat/${c.id}?lawyerId=${c.lawyers.id}`}
                                className="btn btn-primary btn-sm"
                                id={`dashboard-resume-${c.id}`}
                              >
                                Resume
                              </Link>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div>
              {/* Profile card */}
              <motion.div className={styles.profileCard} initial="hidden" animate="show" custom={0} variants={CARD_VARIANTS}>
                <div className={styles.profileTop}>
                  <div className="avatar avatar-xl">{user.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}</div>
                  <div className={styles.profileBadge}><Shield size={11} /> User</div>
                </div>
                <p className={styles.profileName}>{user.name}</p>
                <p className={styles.profileEmail}>{user.email}</p>
                {user.city && (
                  <p className={styles.profileMeta}>{user.city}{user.state ? `, ${user.state}` : ""}</p>
                )}
                <div className={styles.profileStats}>
                  <div className={styles.profileStatItem}>
                    <p className={styles.profileStatVal}>{consultations.length}</p>
                    <p className={styles.profileStatLabel}>Chats</p>
                  </div>
                  <div className={styles.profileStatDivider} />
                  <div className={styles.profileStatItem}>
                    <p className={styles.profileStatVal}>₹{user.walletBalance ?? 0}</p>
                    <p className={styles.profileStatLabel}>Wallet</p>
                  </div>
                  <div className={styles.profileStatDivider} />
                  <div className={styles.profileStatItem}>
                    <p className={styles.profileStatVal}>₹{totalSpent}</p>
                    <p className={styles.profileStatLabel}>Spent</p>
                  </div>
                </div>
              </motion.div>

              {/* Quick actions */}
              <div className={styles.quickActions}>
                <Link href="/lawyers" className={styles.quickAction} id="dashboard-qa-find">
                  <div className={styles.qaIcon} style={{ background: "rgba(201,168,76,0.1)" }}>
                    <Search size={16} color="var(--gold-400)" />
                  </div>
                  <div>
                    <p className={styles.qaLabel}>Find Lawyers</p>
                    <p className={styles.qaSub}>Browse verified lawyers</p>
                  </div>
                  <ChevronRight size={14} className={styles.qaArrow} />
                </Link>
                <Link href="/dashboard" className={styles.quickAction} id="dashboard-qa-wallet">
                  <div className={styles.qaIcon} style={{ background: "rgba(139,92,246,0.1)" }}>
                    <Wallet size={16} color="var(--violet)" />
                  </div>
                  <div>
                    <p className={styles.qaLabel}>My Wallet</p>
                    <p className={styles.qaSub}>Balance: ₹{user.walletBalance ?? 0}</p>
                  </div>
                  <ChevronRight size={14} className={styles.qaArrow} />
                </Link>
              </div>

              {/* Recommended lawyers */}
              {recommendedLawyers.length > 0 && (
                <div className={styles.section} style={{ marginTop: "var(--space-6)" }}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Top Lawyers for You</h2>
                    <Link href="/lawyers" className={styles.seeAll} id="dashboard-see-all-lawyers">See all</Link>
                  </div>
                  <div className={styles.recList}>
                    {recommendedLawyers.map((l, i) => {
                      const initials = l.name.replace("Adv. ", "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                      return (
                        <motion.div
                          key={l.id} className={styles.recCard}
                          custom={i} initial="hidden" animate="show" variants={CARD_VARIANTS}
                        >
                          <div className={styles.recLeft}>
                            <div className="avatar avatar-sm">{initials}</div>
                            <div>
                              <p className={styles.recName}>{l.name}</p>
                              <div className={styles.recMeta}>
                                <Star size={10} fill="var(--gold-400)" color="var(--gold-400)" />
                                <span>{l.rating}</span>
                                <span className={styles.recDot}>·</span>
                                <span>{(l.specializations || [])[0]}</span>
                              </div>
                            </div>
                          </div>
                          <Link
                            href={`/lawyers/${l.id}`}
                            className="btn btn-ghost btn-sm"
                            id={`dashboard-rec-${l.id}`}
                            style={{ whiteSpace: "nowrap" }}
                          >
                            ₹{l.pricePerMinute}/chat
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* First-time CTA */}
          {consultations.length === 0 && !consultLoading && (
            <motion.div
              className={styles.ctaBanner}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className={styles.ctaContent}>
                <Zap size={20} color="var(--gold-400)" />
                <div>
                  <p className={styles.ctaTitle}>Your first consultation is ₹2</p>
                  <p className={styles.ctaSub}>Get expert legal advice from verified advocates across India — instantly.</p>
                </div>
              </div>
              <Link href="/lawyers" className="btn btn-primary" id="dashboard-cta-find-lawyer">
                Get Legal Help Now <ArrowUpRight size={15} />
              </Link>
            </motion.div>
          )}

        </div>
      </div>
      <Footer />
    </>
  );
}
