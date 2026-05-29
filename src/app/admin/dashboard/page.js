"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, CheckCircle, XCircle, Clock, LogOut, Eye, UserPlus,
  X, AlertCircle, RefreshCw, Flag, ChevronDown, ChevronUp, ExternalLink,
  Mail, MapPin, Briefcase, BookOpen, IndianRupee, Star, FileText, Globe
} from "lucide-react";
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
  const [expandedId, setExpandedId] = useState(null); // which card is expanded
  const [activeTab, setActiveTab] = useState("pending"); // pending | verified | reports

  useEffect(() => {
    if (!loading && !isAdmin) router.replace("/admin");
  }, [isAdmin, loading, router]);

  // Prevent browser back from reaching this page after logout
  useEffect(() => {
    if (isAdmin) window.history.pushState(null, "", window.location.href);
    const block = () => { if (isAdmin) window.history.pushState(null, "", window.location.href); };
    window.addEventListener("popstate", block);
    return () => window.removeEventListener("popstate", block);
  }, [isAdmin]);

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    const token = localStorage.getItem("lawtalk_admin_token");
    if (!token) { setDataLoading(false); return; }
    const { data } = await supabase.rpc("admin_get_lawyers", { p_token: token });
    if (data?.success) setLawyers(data.data || []);
    const { data: rData } = await supabase.rpc("admin_get_reports", { p_token: token });
    if (rData?.success) setReports(rData.data || []);
    setDataLoading(false);
  }, []);

  useEffect(() => { if (isAdmin) fetchData(); }, [isAdmin, fetchData]);

  if (loading || !isAdmin) return null;

  const pendingLawyers = lawyers.filter(l => l.status === LAWYER_STATUS.PENDING);
  const verifiedLawyers = lawyers.filter(l => l.status === LAWYER_STATUS.VERIFIED);
  const rejectedLawyers = lawyers.filter(l => l.status === LAWYER_STATUS.REJECTED);
  const openReports = reports.filter(r => r.status === "open");

  const handleVerify = async (lawyerId, newStatus, reason = "") => {
    setActionLoading(p => ({ ...p, [lawyerId]: true }));
    const token = localStorage.getItem("lawtalk_admin_token");
    const { data } = await supabase.rpc("admin_update_lawyer", {
      p_token: token, p_lawyer_id: lawyerId, p_status: newStatus,
      p_rejection_reason: reason || null,
    });
    if (data?.success) {
      setLawyers(prev => prev.map(l => l.id === lawyerId
        ? { ...l, status: newStatus, rejection_reason: reason || null, verified_at: newStatus === "verified" ? new Date().toISOString() : null }
        : l));
      setExpandedId(null);
    }
    setActionLoading(p => ({ ...p, [lawyerId]: false }));
  };

  const handleUpdateReport = async (id, status, notes = "") => {
    const token = localStorage.getItem("lawtalk_admin_token");
    const { data } = await supabase.rpc("admin_update_report", {
      p_token: token, p_report_id: id, p_status: status, p_admin_notes: notes || null,
    });
    if (data?.success) setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreateError(""); setCreateSuccess("");
    if (!newAdmin.username || !newAdmin.password || !newAdmin.name) { setCreateError("All fields are required."); return; }
    if (newAdmin.password.length < 8) { setCreateError("Password must be at least 8 characters."); return; }
    setCreateLoading(true);
    const result = await createAdmin(newAdmin.username, newAdmin.password, newAdmin.name);
    setCreateLoading(false);
    if (result.success) { setCreateSuccess("Admin created!"); setNewAdmin({ username: "", password: "", name: "" }); }
    else setCreateError(result.error || "Failed.");
  };

  const openDoc = async (path) => {
    if (!path) return;
    const { data } = await supabase.storage.from("lawyer-documents").createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const initials = (name) => name?.replace("Adv. ", "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "LA";

  // Full detail panel for a lawyer card
  const LawyerDetail = ({ lawyer }) => (
    <div className={styles.detailPanel}>
      <div className={styles.detailGrid}>
        <div className={styles.detailSection}>
          <p className={styles.detailLabel}><Mail size={13} /> Email</p>
          <p className={styles.detailVal}>{lawyer.email}</p>
        </div>
        <div className={styles.detailSection}>
          <p className={styles.detailLabel}><MapPin size={13} /> Location</p>
          <p className={styles.detailVal}>{lawyer.city}, {lawyer.state}</p>
        </div>
        <div className={styles.detailSection}>
          <p className={styles.detailLabel}><Shield size={13} /> Bar Council ID</p>
          <p className={styles.detailVal}>{lawyer.bar_council_id || "—"}</p>
        </div>
        <div className={styles.detailSection}>
          <p className={styles.detailLabel}><Briefcase size={13} /> Experience</p>
          <p className={styles.detailVal}>{lawyer.experience} years</p>
        </div>
        <div className={styles.detailSection}>
          <p className={styles.detailLabel}><IndianRupee size={13} /> Rate</p>
          <p className={styles.detailVal}>₹{lawyer.price_per_chat}/chat</p>
        </div>
        <div className={styles.detailSection}>
          <p className={styles.detailLabel}><Globe size={13} /> Languages</p>
          <p className={styles.detailVal}>{(lawyer.languages || []).join(", ") || "—"}</p>
        </div>
        <div className={styles.detailSection} style={{ gridColumn: "1/-1" }}>
          <p className={styles.detailLabel}><BookOpen size={13} /> Education</p>
          <p className={styles.detailVal}>{lawyer.education || "—"}</p>
        </div>
        <div className={styles.detailSection} style={{ gridColumn: "1/-1" }}>
          <p className={styles.detailLabel}><FileText size={13} /> Bio</p>
          <p className={styles.detailVal} style={{ lineHeight: 1.7 }}>{lawyer.bio || "—"}</p>
        </div>
      </div>

      {/* Documents */}
      <div className={styles.docsRow}>
        <p className={styles.detailLabel} style={{ marginBottom: "var(--space-3)" }}>📄 Uploaded Documents</p>
        <div className={styles.docBtns}>
          {lawyer.marksheet_url ? (
            <button className={styles.docBtn} onClick={() => openDoc(lawyer.marksheet_url)} id={`doc-marksheet-${lawyer.id}`}>
              <FileText size={14} /> Law Degree / Marksheet <ExternalLink size={12} />
            </button>
          ) : <span className={styles.docMissing}>✗ Marksheet not uploaded</span>}
          {lawyer.bar_certificate_url ? (
            <button className={styles.docBtn} onClick={() => openDoc(lawyer.bar_certificate_url)} id={`doc-bar-${lawyer.id}`}>
              <Shield size={14} /> Bar Certificate <ExternalLink size={12} />
            </button>
          ) : <span className={styles.docMissing}>✗ Bar Certificate not uploaded</span>}
          {lawyer.id_proof_url ? (
            <button className={styles.docBtn} onClick={() => openDoc(lawyer.id_proof_url)} id={`doc-id-${lawyer.id}`}>
              <Users size={14} /> Government ID Proof <ExternalLink size={12} />
            </button>
          ) : <span className={styles.docMissing}>✗ ID Proof not uploaded</span>}
        </div>
      </div>

      {/* Action buttons */}
      {lawyer.status === "pending" && (
        <div className={styles.detailActions}>
          <button
            className="btn btn-primary"
            onClick={() => handleVerify(lawyer.id, "verified")}
            disabled={actionLoading[lawyer.id]}
            id={`admin-approve-${lawyer.id}`}
          >
            {actionLoading[lawyer.id] ? <span className="spinner" /> : <><CheckCircle size={14} /> Approve Application</>}
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              const reason = prompt("Rejection reason (required):");
              if (reason?.trim()) handleVerify(lawyer.id, "rejected", reason.trim());
            }}
            disabled={actionLoading[lawyer.id]}
            id={`admin-reject-${lawyer.id}`}
          >
            <XCircle size={14} /> Reject
          </button>
        </div>
      )}
      {lawyer.status === "verified" && (
        <div className={styles.detailActions}>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              const reason = prompt("Reason for revoking verification:");
              if (reason !== null) handleVerify(lawyer.id, "rejected", reason);
            }}
            id={`admin-revoke-${lawyer.id}`}
          >
            <XCircle size={14} /> Revoke Verification
          </button>
        </div>
      )}
    </div>
  );

  const LawyerCard = ({ lawyer }) => {
    const isExpanded = expandedId === lawyer.id;
    return (
      <motion.div className={styles.applicationCard} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {/* Card header — always visible */}
        <div className={styles.cardHeader} onClick={() => setExpandedId(isExpanded ? null : lawyer.id)}>
          <div className={styles.appLeft}>
            <div className="avatar avatar-md">{initials(lawyer.name)}</div>
            <div className={styles.appInfo}>
              <p className={styles.appName}>{lawyer.name}</p>
              <p className={styles.appSpec}>{(lawyer.specializations || []).slice(0, 3).join(" · ")}</p>
              <p className={styles.appMeta}>{lawyer.city}, {lawyer.state} · {lawyer.experience} yrs exp · Applied {new Date(lawyer.created_at).toLocaleDateString("en-IN")}</p>
            </div>
          </div>
          <div className={styles.appRight}>
            {lawyer.status === "pending" && <span className="badge badge-gold"><Clock size={10} /> Pending</span>}
            {lawyer.status === "verified" && <span className="badge badge-green"><CheckCircle size={10} /> Verified</span>}
            {lawyer.status === "rejected" && <span className="badge badge-red"><XCircle size={10} /> Rejected</span>}
            <button className={styles.expandBtn} aria-label="Toggle details">
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Expandable detail panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: "hidden" }}>
              <LawyerDetail lawyer={lawyer} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className={styles.page}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div className={styles.logoIcon}><Shield size={18} /></div>
          <span className={styles.logoText}>LawTalk Admin</span>
        </div>
        <nav className={styles.sidebarNav}>
          <p className={styles.navSection}>Dashboard</p>
          {[
            { id: "pending", label: `Pending (${pendingLawyers.length})`, icon: Clock },
            { id: "verified", label: `Verified (${verifiedLawyers.length})`, icon: CheckCircle },
            { id: "reports", label: `Reports (${openReports.length})`, icon: Flag },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`${styles.navItem} ${activeTab === id ? styles.navActive : ""}`}
              onClick={() => setActiveTab(id)}
              id={`admin-tab-${id}`}
            >
              <Icon size={15} /> {label}
              {id === "reports" && openReports.length > 0 && (
                <span className={styles.navBadge}>{openReports.length}</span>
              )}
            </button>
          ))}
          <p className={styles.navSection} style={{ marginTop: "var(--space-4)" }}>Admin</p>
          <button className={styles.navItem} onClick={() => setShowCreateAdmin(v => !v)} id="admin-nav-create-admin">
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
          <button className="btn btn-danger btn-sm" onClick={() => { adminLogout(); router.replace("/admin"); }} id="admin-logout-btn">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Admin Dashboard</h1>
            <p className={styles.subtitle}>Logged in as <strong style={{ color: "var(--gold-400)" }}>@{adminSession?.username}</strong> · <span className="online-dot" style={{ display: "inline-block", marginRight: 4 }} />Live</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={fetchData} id="admin-refresh-btn">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          {[
            { label: "Pending Review", value: pendingLawyers.length, icon: Clock, color: "rgba(201,168,76,0.12)", iconColor: "var(--gold-400)" },
            { label: "Verified Lawyers", value: verifiedLawyers.length, icon: CheckCircle, color: "rgba(16,185,129,0.1)", iconColor: "var(--emerald)" },
            { label: "Rejected", value: rejectedLawyers.length, icon: XCircle, color: "rgba(244,63,94,0.1)", iconColor: "#f87171" },
            { label: "Total Lawyers", value: lawyers.length, icon: Users, color: "rgba(139,92,246,0.1)", iconColor: "var(--violet)" },
            { label: "Open Reports", value: openReports.length, icon: Flag, color: "rgba(244,63,94,0.07)", iconColor: "#f87171" },
          ].map((s, i) => (
            <motion.div key={s.label} className={styles.statCard} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <div className={styles.statIcon} style={{ background: s.color }}><s.icon size={20} color={s.iconColor} /></div>
              <div>
                <p className={styles.statVal}>{dataLoading ? "—" : s.value}</p>
                <p className={styles.statLabel}>{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Create Admin Panel */}
        <AnimatePresence>
          {showCreateAdmin && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={styles.section} style={{ marginBottom: "var(--space-6)" }}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}><UserPlus size={18} /> Create New Admin</h2>
                <button onClick={() => { setShowCreateAdmin(false); setCreateError(""); setCreateSuccess(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
              </div>
              <form onSubmit={handleCreateAdmin} style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap", alignItems: "flex-end" }}>
                {[{ label: "Full Name", key: "name", placeholder: "e.g. Namit Kumar", type: "text" }, { label: "Username", key: "username", placeholder: "e.g. admin2", type: "text" }, { label: "Password (min. 8)", key: "password", placeholder: "Strong password", type: "password" }].map(f => (
                  <div className="form-group" key={f.key} style={{ flex: 1, minWidth: 160 }}>
                    <label className="form-label">{f.label} *</label>
                    <input type={f.type} className="form-input" placeholder={f.placeholder} value={newAdmin[f.key]} onChange={e => setNewAdmin(p => ({ ...p, [f.key]: e.target.value }))} autoComplete="off" />
                  </div>
                ))}
                {createError && <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "#f87171" }}><AlertCircle size={14} />{createError}</div>}
                {createSuccess && <div style={{ width: "100%", fontSize: "0.82rem", color: "var(--emerald)" }}><CheckCircle size={14} /> {createSuccess}</div>}
                <button type="submit" className="btn btn-primary" disabled={createLoading} id="admin-create-submit-btn">
                  {createLoading ? <span className="spinner" /> : <><UserPlus size={14} /> Create Admin</>}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab content */}
        {activeTab === "pending" && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Pending Applications {pendingLawyers.length > 0 && <span className="badge badge-gold" style={{ marginLeft: 8 }}>{pendingLawyers.length}</span>}</h2>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Click any card to expand full details and documents</p>
            </div>
            {dataLoading ? <div className={styles.empty}><span className="spinner" /></div>
              : pendingLawyers.length === 0 ? (
                <div className={styles.empty}><CheckCircle size={40} color="var(--emerald)" /><p>No pending applications 🎉</p></div>
              ) : (
                <div className={styles.applicationList}>
                  {pendingLawyers.map(l => <LawyerCard key={l.id} lawyer={l} />)}
                </div>
              )}
          </section>
        )}

        {activeTab === "verified" && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Verified Lawyers ({verifiedLawyers.length})</h2>
            </div>
            {dataLoading ? <div className={styles.empty}><span className="spinner" /></div>
              : verifiedLawyers.length === 0 ? <div className={styles.empty}><p>No verified lawyers yet.</p></div>
              : <div className={styles.applicationList}>{verifiedLawyers.map(l => <LawyerCard key={l.id} lawyer={l} />)}</div>
            }
          </section>
        )}

        {activeTab === "reports" && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}><Flag size={18} style={{ color: "#f87171" }} /> Reports Assigned to You {openReports.length > 0 && <span className="badge badge-gold" style={{ marginLeft: 8 }}>{openReports.length} open</span>}</h2>
            </div>
            {dataLoading ? <div className={styles.empty}><span className="spinner" /></div>
              : reports.length === 0 ? <div className={styles.empty}><CheckCircle size={40} color="var(--emerald)" /><p>No reports assigned. Great job! 🎉</p></div>
              : (
                <div className={styles.applicationList}>
                  {reports.map((r, i) => (
                    <motion.div key={r.id} className={styles.applicationCard} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <div className={styles.cardHeader}>
                        <div className={styles.appLeft}>
                          <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "rgba(244,63,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Flag size={18} color="#f87171" />
                          </div>
                          <div className={styles.appInfo}>
                            <p className={styles.appName} style={{ color: "#f87171" }}>{r.reason}</p>
                            <p className={styles.appSpec}>{r.description?.slice(0, 120)}{r.description?.length > 120 ? "…" : ""}</p>
                            <p className={styles.appMeta}>Reported {new Date(r.created_at).toLocaleDateString("en-IN")} · Consultation: {r.consultation_id?.slice(0, 8) || "N/A"}</p>
                          </div>
                        </div>
                        <div className={styles.appRight}>
                          <span className={`badge ${r.status === "open" ? "badge-gold" : r.status === "resolved" ? "badge-green" : "badge"}`}>
                            {r.status === "open" ? <><Clock size={10} /> Open</> : r.status === "investigating" ? <><Eye size={10} /> Investigating</> : r.status === "resolved" ? <><CheckCircle size={10} /> Resolved</> : <><XCircle size={10} /> Dismissed</>}
                          </span>
                          {r.status === "open" && (
                            <div style={{ display: "flex", gap: "var(--space-2)" }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => handleUpdateReport(r.id, "investigating")} id={`admin-investigate-${r.id}`}><Eye size={12} /> Investigate</button>
                              <button className="btn btn-primary btn-sm" onClick={() => { const n = prompt("Resolution notes:"); if (n !== null) handleUpdateReport(r.id, "resolved", n); }} id={`admin-resolve-${r.id}`}><CheckCircle size={12} /> Resolve</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleUpdateReport(r.id, "dismissed")} id={`admin-dismiss-${r.id}`}>Dismiss</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
          </section>
        )}
      </main>
    </div>
  );
}
