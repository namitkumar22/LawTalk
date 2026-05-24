"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle, XCircle, Shield, Star, Clock, MapPin,
  Globe, FileText, User, Briefcase, IndianRupee, Phone, Mail
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { useLawyers } from "@/context/LawyerContext";
import { LAWYER_STATUS } from "@/lib/constants";
import styles from "./page.module.css";

// Backend dev:
// GET /api/admin/lawyers/:id — full lawyer details with document URLs (signed S3 URLs)
// PUT /api/admin/lawyers/:id/verify { status: 'verified' | 'rejected', reason?: string }
// After verification: trigger notification (SMS/email) to lawyer
// Document URLs should be signed/time-limited (not permanent public URLs)

export default function AdminLawyerReviewPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const { getLawyerById, verifyLawyer } = useLawyers();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionDone, setActionDone] = useState(false);
  const [actionType, setActionType] = useState("");

  if (!isAdmin) {
    router.push("/admin");
    return null;
  }

  const lawyer = getLawyerById(id);

  if (!lawyer) {
    return (
      <div style={{ padding: "var(--space-8)", textAlign: "center" }}>
        <h2>Lawyer not found</h2>
        <Link href="/admin/dashboard" className="btn btn-primary" style={{ marginTop: "var(--space-4)", display: "inline-flex" }}>Back to Dashboard</Link>
      </div>
    );
  }

  const initials = lawyer.name.replace("Adv. ", "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const handleApprove = () => {
    // Backend dev: PUT /api/admin/lawyers/:id/verify { status: 'verified' }
    // Then: POST /api/notifications/send { userId: lawyer.userId, type: 'verification_approved', message: '...' }
    verifyLawyer(id, LAWYER_STATUS.VERIFIED);
    setActionType("approved");
    setActionDone(true);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    // Backend dev: PUT /api/admin/lawyers/:id/verify { status: 'rejected', reason: rejectReason }
    // Then send rejection notification with reason to lawyer
    verifyLawyer(id, LAWYER_STATUS.REJECTED, rejectReason);
    setShowRejectModal(false);
    setActionType("rejected");
    setActionDone(true);
  };

  if (actionDone) {
    return (
      <div className={styles.actionDone}>
        <motion.div
          className={styles.actionDoneCard}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {actionType === "approved"
            ? <CheckCircle size={56} color="var(--emerald)" />
            : <XCircle size={56} color="#f87171" />}
          <h2>{actionType === "approved" ? "Lawyer Approved!" : "Application Rejected"}</h2>
          <p>
            {actionType === "approved"
              ? `${lawyer.name}'s profile is now live on LawTalk. They will be notified.`
              : `${lawyer.name}'s application has been rejected. They will be notified with the reason.`}
          </p>
          <Link href="/admin/dashboard" className="btn btn-primary" id="admin-review-back-btn">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/admin/dashboard" className={styles.backBtn}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className={styles.headerActions}>
          {lawyer.status === LAWYER_STATUS.PENDING && (
            <>
              <button
                className="btn btn-danger"
                onClick={() => setShowRejectModal(true)}
                id="admin-reject-btn"
              >
                <XCircle size={16} /> Reject Application
              </button>
              <button
                className="btn btn-success"
                onClick={handleApprove}
                id="admin-approve-btn"
              >
                <CheckCircle size={16} /> Approve &amp; Verify
              </button>
            </>
          )}
          {lawyer.status === LAWYER_STATUS.VERIFIED && (
            <span className="badge badge-green"><CheckCircle size={12} /> Verified</span>
          )}
          {lawyer.status === LAWYER_STATUS.REJECTED && (
            <span className="badge badge-red"><XCircle size={12} /> Rejected</span>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {/* Profile overview */}
        <div className={styles.profileCard}>
          <div className="avatar avatar-xl">{initials}</div>
          <div className={styles.profileInfo}>
            <h1 className={styles.lawyerName}>{lawyer.name}</h1>
            <div className={styles.metaItems}>
              <span><MapPin size={13} />{lawyer.city}, {lawyer.state}</span>
              <span><Phone size={13} />+91 {lawyer.phone}</span>
              {lawyer.email && <span><Mail size={13} />{lawyer.email}</span>}
              <span><Clock size={13} />{lawyer.experience} years exp.</span>
            </div>
            <p className={styles.submitDate}>Submitted: {new Date(lawyer.createdAt).toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className={styles.grid}>
          {/* Professional Details */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}><Briefcase size={15} /> Professional Details</h3>
            <div className={styles.detailList}>
              <div className={styles.detailRow}><span>Bar Council ID</span><strong>{lawyer.barCouncilId}</strong></div>
              <div className={styles.detailRow}><span>Education</span><strong>{lawyer.education}</strong></div>
              <div className={styles.detailRow}><span>Experience</span><strong>{lawyer.experience} years</strong></div>
              <div className={styles.detailRow}><span>Price</span><strong>₹{lawyer.pricePerMinute}/chat</strong></div>
              <div className={styles.detailRow}><span>Availability</span><strong>{lawyer.availability || "Not specified"}</strong></div>
            </div>
          </div>

          {/* Specializations & Languages */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}><Shield size={15} /> Specializations &amp; Languages</h3>
            <p className={styles.label}>Specializations</p>
            <div className={styles.badges}>
              {lawyer.specializations?.map((s) => (
                <span key={s} className="badge badge-gold" style={{ fontSize: "0.72rem" }}>{s}</span>
              ))}
            </div>
            <p className={styles.label} style={{ marginTop: "var(--space-4)" }}>Languages</p>
            <div className={styles.badges}>
              {lawyer.languages?.map((l) => (
                <span key={l} className="badge badge-blue" style={{ fontSize: "0.72rem" }}>{l}</span>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className={styles.section} style={{ gridColumn: "1 / -1" }}>
            <h3 className={styles.sectionTitle}><User size={15} /> Professional Bio</h3>
            <p className={styles.bio}>{lawyer.bio || "No bio provided."}</p>
          </div>

          {/* Documents */}
          <div className={styles.section} style={{ gridColumn: "1 / -1" }}>
            <h3 className={styles.sectionTitle}><FileText size={15} /> Submitted Documents</h3>
            {/* Backend dev: Display signed URLs from S3/GCS for document preview */}
            {/* Documents should be securely stored and access-controlled */}
            <div className={styles.docGrid}>
              {[
                { label: "Law Degree / Marksheet", key: "marksheet", name: lawyer.marksheetName },
                { label: "Bar Council Certificate", key: "barCertificate", name: lawyer.barCertificateName },
                { label: "Government ID Proof", key: "idProof", name: lawyer.idProofName },
              ].map((doc) => (
                <div key={doc.key} className={styles.docCard}>
                  <FileText size={20} color="var(--gold-400)" />
                  <div>
                    <p className={styles.docLabel}>{doc.label}</p>
                    {lawyer[doc.key] ? (
                      <>
                        <p className={styles.docName}>{doc.name || "Document uploaded"}</p>
                        <span className="badge badge-green" style={{ fontSize: "0.68rem" }}>
                          <CheckCircle size={10} /> Uploaded
                        </span>
                      </>
                    ) : (
                      <span className="badge badge-red" style={{ fontSize: "0.68rem" }}>Not uploaded</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className={styles.docNote}>
              Backend dev: In production, each document above should be a clickable link with a signed URL
              (Razorpay Thirdwatch, S3, or similar) to preview the actual document securely.
            </p>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRejectModal(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}>
              <h2>Reject Application</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-4)" }}>
                Please provide a reason for rejecting <strong>{lawyer.name}'s</strong> application. They will be notified.
              </p>
              <div className="form-group">
                <label className="form-label">Reason for Rejection *</label>
                <textarea
                  className="form-textarea"
                  placeholder="e.g. Documents unclear/expired, Bar Council ID mismatch, Invalid degree certificate..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  id="admin-reject-reason"
                />
              </div>
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
                <button className="btn btn-ghost" onClick={() => setShowRejectModal(false)}>Cancel</button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleReject} id="admin-reject-confirm">
                  <XCircle size={15} /> Confirm Rejection
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
