"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Users, CheckCircle, XCircle, Clock, LogOut, Eye, UserPlus, X, AlertCircle, RefreshCw, Flag, FileText } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { supabase } from "@/utils/supabase/client";
import { LAWYER_STATUS } from "@/lib/constants";
import styles from "./page.module.css";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { adminSession, isAdmin, adminLogout, loading, createAdmin } = useAdmin();
  const [lawyers, setLawyers] = useState([]);
  const [reports, setReports] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ username: "", password: "", name: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (!loading && !isAdmin) router.push("/admin");
  }, [isAdmin, loading, router]);

  const fetchLawyers = useCallback(async () => {
    setDataLoading(true);
    const token = localStorage.getItem("lawtalk_admin_token");
    if (!token) { setDataLoading(false); return; }

    // Use RPC so SECURITY DEFINER bypasses RLS
    const { data, error } = await supabase.rpc("admin_get_lawyers", { p_token: token });
    if (!error && data?.success) setLawyers(data.data || []);

    // Fetch reports assigned to this admin
    const { data: rData, error: rError } = await supabase.rpc("admin_get_reports", { p_token: token });
    if (!rError && rData?.success) setReports(rData.data || []);

    setDataLoading(false);
  }, []);

  // Update report status
  const handleUpdateReport = async (reportId, status, notes = "") => {
    const token = localStorage.getItem("lawtalk_admin_token");
    const { data } = await supabase.rpc("admin_update_report", {
      p_token: token,
      p_report_id: reportId,
      p_status: status,
      p_admin_notes: notes || null,
    });
    if (data?.success) {
      setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status } : r));
    }
  };

  useEffect(() => {
    if (isAdmin) fetchLawyers();
  }, [isAdmin, fetchLawyers]);

  if (loading || !isAdmin) return null;

  const pendingLawyers = lawyers.filter((l) => l.status === LAWYER_STATUS.PENDING);
  const verifiedLawyers = lawyers.filter((l) => l.status === LAWYER_STATUS.VERIFIED);
  const rejectedLawyers = lawyers.filter((l) => l.status === LAWYER_STATUS.REJECTED);

  const stats = [
    { label: "Pending Review", value: pendingLawyers.length, icon: Clock, color: "rgba(201,168,76,0.15)", iconColor: "var(--gold-400)" },
    { label: "Verified Lawyers", value: verifiedLawyers.length, icon: CheckCircle, color: "rgba(16,185,129,0.1)", iconColor: "var(--emerald)" },
    { label: "Rejected", value: rejectedLawyers.length, icon: XCircle, color: "rgba(244,63,94,0.1)", iconColor: "#f87171" },
    { label: "Total Registered", value: lawyers.length, icon: Users, color: "rgba(139,92,246,0.1)", iconColor: "var(--violet)" },
    { label: "Open Reports", value: reports.filter((r) => r.status === "open").length, icon: Flag, color: "rgba(244,63,94,0.08)", iconColor: "#f87171" },
  ];

  const handleVerify = async (lawyerId, newStatus, reason = "") => {
    setActionLoading((p) => ({ ...p, [lawyerId]: true }));
    const token = localStorage.getItem("lawtalk_admin_token");

    // Use RPC so SECURITY DEFINER bypasses RLS
    const { data, error } = await supabase.rpc("admin_update_lawyer", {
      p_token: token,
      p_lawyer_id: lawyerId,
      p_status: newStatus,
      p_rejection_reason: reason || null,
    });

    if (!error && data?.success) {
      const updates = {
        status: newStatus,
        rejection_reason: reason || null,
        verified_at: newStatus === "verified" ? new Date().toISOString() : null,
      };
      setLawyers((prev) =>
        prev.map((l) => l.id === lawyerId ? { ...l, ...updates } : l)
      );
    }
    setActionLoading((p) => ({ ...p, [lawyerId]: false }));
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    if (!newAdmin.username || !newAdmin.password || !newAdmin.name) {
      setCreateError("All fields are required.");
      return;
    }
    if (newAdmin.password.length < 8) {
      setCreateError("Password must be at least 8 characters.");
      return;
    }
    setCreateLoading(true);
    const result = await createAdmin(newAdmin.username, newAdmin.password, newAdmin.name);
    setCreateLoading(false);
    if (result.success) {
      setCreateSuccess("Admin created successfully!");
      setNewAdmin({ username: "", password: "", name: "" });
    } else {
      setCreateError(result.error || "Failed to create admin.");
    }
  };

  const getDocUrl = async (path) => {
    if (!path) return null;
    const { data } = await supabase.storage.from("lawyer-documents").createSignedUrl(path, 3600);
    return data?.signedUrl;
  };

  return (
    <div className={styles.page}>
      {/* Admin sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div className={styles.logoIcon}><Shield size={18} /></div>
          <span className={styles.logoText}>LawTalk Admin</span>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.navSection}>Dashboard</div>
          <Link href="/admin/dashboard" className={`${styles.navItem} ${styles.navActive}`} id="admin-nav-dashboard">
            <Shield size={15} /> Overview
          </Link>
          <div className={`${styles.navSection}`} style={{ marginTop: "var(--space-4)" }}>Management</div>
          <button
            className={styles.navItem}
            onClick={() => setShowCreateAdmin((v) => !v)}
            id="admin-nav-create-admin"
            style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
          >
            <UserPlus size={15} /> Create Admin
          </button>
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.adminInfo}>
            <div className="avatar avatar-sm">{adminSession?.name?.slice(0, 2).toUpperCase() || "AD"}</div>
            <div>
              <p className={styles.adminName}>{adminSession?.name}</p>
              <p className={styles.adminRole}>@{adminSession?.username}</p>
            </div>
          </div>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => { adminLogout(); router.push("/admin"); }}
            id="admin-logout-btn"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Admin Dashboard</h1>
            <p className={styles.subtitle}>Manage lawyer verifications and platform oversight</p>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.sessionInfo}>
              <span className="online-dot" />
              Logged in as <strong>{adminSession?.username}</strong>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={fetchLawyers} id="admin-refresh-btn">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Create Admin Panel */}
        <AnimatePresence>
          {showCreateAdmin && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={styles.section}
              style={{ marginBottom: "var(--space-6)" }}
            >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}><UserPlus size={18} /> Create New Admin</h2>
                <button onClick={() => { setShowCreateAdmin(false); setCreateError(""); setCreateSuccess(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateAdmin} style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-input" placeholder="e.g. Namit Kumar" value={newAdmin.name} onChange={(e) => setNewAdmin((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
                  <label className="form-label">Username *</label>
                  <input type="text" className="form-input" placeholder="e.g. admin2" value={newAdmin.username} onChange={(e) => setNewAdmin((p) => ({ ...p, username: e.target.value.replace(/\s/g, "") }))} autoComplete="off" />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
                  <label className="form-label">Password * (min. 8 chars)</label>
                  <input type="password" className="form-input" placeholder="Strong password" value={newAdmin.password} onChange={(e) => setNewAdmin((p) => ({ ...p, password: e.target.value }))} autoComplete="new-password" />
                </div>
                {createError && <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "0.82rem", color: "#f87171" }}><AlertCircle size={14} />{createError}</div>}
                {createSuccess && <div style={{ width: "100%", fontSize: "0.82rem", color: "var(--emerald)" }}><CheckCircle size={14} /> {createSuccess}</div>}
                <button type="submit" className="btn btn-primary" disabled={createLoading} id="admin-create-submit-btn">
                  {createLoading ? <span className="spinner" /> : <><UserPlus size={14} /> Create Admin</>}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className={styles.statsGrid}>
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className={styles.statIcon} style={{ background: stat.color }}>
                <stat.icon size={20} color={stat.iconColor} />
              </div>
              <div>
                <p className={styles.statVal}>{dataLoading ? "—" : stat.value}</p>
                <p className={styles.statLabel}>{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pending Applications */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Pending Applications
              {pendingLawyers.length > 0 && (
                <span className="badge badge-gold" style={{ marginLeft: "var(--space-3)", fontSize: "0.75rem" }}>
                  {pendingLawyers.length} pending
                </span>
              )}
            </h2>
          </div>

          {dataLoading ? (
            <div className={styles.empty}><span className="spinner" /></div>
          ) : pendingLawyers.length === 0 ? (
            <div className={styles.empty}>
              <CheckCircle size={40} color="var(--emerald)" />
              <p>No pending applications. All caught up! 🎉</p>
            </div>
          ) : (
            <div className={styles.applicationList}>
              {pendingLawyers.map((lawyer, i) => (
                <motion.div
                  key={lawyer.id}
                  className={styles.applicationCard}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className={styles.appLeft}>
                    <div className="avatar avatar-md">
                      {lawyer.name.replace("Adv. ", "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className={styles.appInfo}>
                      <p className={styles.appName}>{lawyer.name}</p>
                      <p className={styles.appSpec}>{(lawyer.specializations || []).join(", ")}</p>
                      <p className={styles.appMeta}>{lawyer.city}, {lawyer.state} · {lawyer.experience} yrs · Bar: {lawyer.bar_council_id}</p>
                      <p className={styles.appMeta}>{lawyer.email}</p>
                    </div>
                  </div>
                  <div className={styles.appRight}>
                    <span className="badge badge-gold"><Clock size={11} /> Pending</span>
                    <p className={styles.appDate}>{new Date(lawyer.created_at).toLocaleDateString("en-IN")}</p>
                    <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                      {/* View documents */}
                      {lawyer.marksheet_url && (
                        <a
                          href="#"
                          onClick={async (e) => { e.preventDefault(); const url = await getDocUrl(lawyer.marksheet_url); if (url) window.open(url, "_blank"); }}
                          className="btn btn-ghost btn-sm"
                          id={`admin-view-doc-${lawyer.id}`}
                        >
                          <Eye size={13} /> Docs
                        </a>
                      )}
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleVerify(lawyer.id, "verified")}
                        disabled={actionLoading[lawyer.id]}
                        id={`admin-approve-${lawyer.id}`}
                      >
                        {actionLoading[lawyer.id] ? <span className="spinner" /> : <><CheckCircle size={13} /> Approve</>}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          const reason = prompt("Rejection reason (optional):");
                          handleVerify(lawyer.id, "rejected", reason || "Application does not meet requirements.");
                        }}
                        disabled={actionLoading[lawyer.id]}
                        id={`admin-reject-${lawyer.id}`}
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Verified Lawyers */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Verified Lawyers ({verifiedLawyers.length})</h2>
          </div>
          <div className={styles.applicationList}>
            {verifiedLawyers.slice(0, 8).map((lawyer) => (
              <div key={lawyer.id} className={styles.applicationCard}>
                <div className={styles.appLeft}>
                  <div className="avatar avatar-md">
                    {lawyer.name.replace("Adv. ", "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className={styles.appInfo}>
                    <p className={styles.appName}>{lawyer.name}</p>
                    <p className={styles.appSpec}>{(lawyer.specializations || []).slice(0, 2).join(", ")}</p>
                    <p className={styles.appMeta}>{lawyer.city} · ₹{lawyer.price_per_chat}/chat · {lawyer.total_consultations} consultations</p>
                  </div>
                </div>
                <div className={styles.appRight}>
                  <span className="badge badge-green"><CheckCircle size={11} /> Verified</span>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      const reason = prompt("Reason for revoking verification:");
                      if (reason !== null) handleVerify(lawyer.id, "rejected", reason);
                    }}
                    style={{ fontSize: "0.7rem" }}
                    id={`admin-revoke-${lawyer.id}`}
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reports Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Flag size={18} style={{ color: "#f87171" }} /> Reports Assigned to You
              {reports.filter((r) => r.status === "open").length > 0 && (
                <span className="badge badge-gold" style={{ marginLeft: "var(--space-3)", fontSize: "0.75rem" }}>
                  {reports.filter((r) => r.status === "open").length} open
                </span>
              )}
            </h2>
          </div>

          {dataLoading ? (
            <div className={styles.empty}><span className="spinner" /></div>
          ) : reports.length === 0 ? (
            <div className={styles.empty}>
              <CheckCircle size={40} color="var(--emerald)" />
              <p>No reports assigned to you. Great job! 🎉</p>
            </div>
          ) : (
            <div className={styles.applicationList}>
              {reports.map((report, i) => (
                <motion.div
                  key={report.id}
                  className={styles.applicationCard}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div className={styles.appLeft}>
                    <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "rgba(244,63,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Flag size={18} color="#f87171" />
                    </div>
                    <div className={styles.appInfo}>
                      <p className={styles.appName} style={{ color: "#f87171" }}>{report.reason}</p>
                      <p className={styles.appSpec}>{report.description?.slice(0, 100)}{report.description?.length > 100 ? "…" : ""}</p>
                      <p className={styles.appMeta}>Reported on {new Date(report.created_at).toLocaleDateString("en-IN")} · Consultation: {report.consultation_id?.slice(0, 8) || "N/A"}</p>
                    </div>
                  </div>
                  <div className={styles.appRight}>
                    <span className={`badge ${report.status === "open" ? "badge-gold" : report.status === "resolved" ? "badge-green" : "badge"}`}>
                      {report.status === "open" ? <><Clock size={11} /> Open</> : report.status === "investigating" ? <><Eye size={11} /> Investigating</> : report.status === "resolved" ? <><CheckCircle size={11} /> Resolved</> : <><XCircle size={11} /> Dismissed</>}
                    </span>
                    {report.status === "open" && (
                      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleUpdateReport(report.id, "investigating")}
                          id={`admin-report-investigate-${report.id}`}
                        >
                          <Eye size={12} /> Investigate
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            const notes = prompt("Resolution notes:");
                            if (notes !== null) handleUpdateReport(report.id, "resolved", notes);
                          }}
                          id={`admin-report-resolve-${report.id}`}
                        >
                          <CheckCircle size={12} /> Resolve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleUpdateReport(report.id, "dismissed")}
                          style={{ fontSize: "0.7rem" }}
                          id={`admin-report-dismiss-${report.id}`}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
