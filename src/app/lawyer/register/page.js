"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, CheckCircle, User, Briefcase, IndianRupee, Upload, ArrowRight, ArrowLeft, AlertCircle, Shield, Eye, EyeOff } from "lucide-react";
import { useLawyers } from "@/context/LawyerContext";
import { useAuth } from "@/context/AuthContext";
import { SPECIALIZATIONS, LANGUAGES } from "@/lib/constants";
import Navbar from "@/components/layout/Navbar";
import styles from "./page.module.css";

const STEPS = [
  { id: 1, label: "Personal", icon: User },
  { id: 2, label: "Professional", icon: Briefcase },
  { id: 3, label: "Pricing", icon: IndianRupee },
  { id: 4, label: "Documents", icon: Upload },
  { id: 5, label: "Review", icon: CheckCircle },
];

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra",
  "Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim",
  "Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi",
  "Jammu & Kashmir","Ladakh","Puducherry","Chandigarh",
];

export default function LawyerRegisterPage() {
  const router = useRouter();
  const { registerLawyer } = useLawyers();
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  // Guard: redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(user?.role === "lawyer" ? "/lawyer/dashboard" : "/dashboard");
    }
  }, [isAuthenticated, authLoading, user, router]);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Store actual File objects for Supabase Storage upload
  const [documents, setDocuments] = useState({
    marksheet: null,
    barCertificate: null,
    idProof: null,
  });

  const [form, setForm] = useState({
    // Personal
    name: "", email: "", password: "", city: "", state: "", dob: "",
    // Professional
    barCouncilId: "", specializations: [], experience: "", languages: [], bio: "", education: "",
    // Pricing
    pricePerMinute: "", availability: "always",
    // Document names (for display)
    marksheetName: "", barCertificateName: "", idProofName: "",
    // Terms
    agreeTerms: false,
  });

  const update = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const toggleArray = (field, val) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(val) ? f[field].filter((x) => x !== val) : [...f[field], val],
    }));
  };

  const handleFile = (field, namefield, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setError("Only JPG, PNG, and PDF files are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5 MB.");
      return;
    }
    setDocuments((d) => ({ ...d, [field]: file }));
    update(namefield, file.name);
    setError("");
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.name.trim() || form.name.trim().length < 3) return "Enter your full name (min. 3 characters).";
      if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email address.";
      if (!form.password || form.password.length < 8) return "Password must be at least 8 characters.";
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) return "Password must have uppercase, lowercase, and a number.";
      if (!form.city.trim()) return "Enter your city.";
      if (!form.state) return "Select your state.";
      if (!form.dob) return "Enter your date of birth.";
    }
    if (step === 2) {
      if (!form.barCouncilId.trim()) return "Enter your Bar Council ID.";
      if (form.specializations.length === 0) return "Select at least one specialization.";
      if (!form.experience) return "Enter years of experience.";
      if (form.languages.length === 0) return "Select at least one language.";
      if (!form.bio.trim() || form.bio.trim().length < 50) return "Write a bio (min. 50 characters).";
      if (!form.education.trim()) return "Enter your educational qualification.";
    }
    if (step === 3) {
      if (!form.pricePerMinute || isNaN(form.pricePerMinute) || +form.pricePerMinute < 5)
        return "Enter a valid price per chat (minimum ₹5).";
    }
    if (step === 4) {
      if (!documents.marksheet) return "Please upload your law degree/marksheet.";
      if (!documents.barCertificate) return "Please upload your Bar Council enrollment certificate.";
      if (!documents.idProof) return "Please upload a government-issued ID proof.";
      if (!form.agreeTerms) return "You must agree to our Terms & Conditions.";
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => s + 1);
  };

  const prev = () => { setError(""); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    const result = await registerLawyer(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        city: form.city.trim(),
        state: form.state,
        dob: form.dob,
        barCouncilId: form.barCouncilId.trim(),
        specializations: form.specializations,
        experience: form.experience,
        languages: form.languages,
        bio: form.bio.trim(),
        education: form.education.trim(),
        pricePerMinute: form.pricePerMinute,
        availability: form.availability,
      },
      documents
    );

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <>
        <Navbar />
        <div className={styles.page}>
          <motion.div className={styles.successCard} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className={styles.successIcon}><CheckCircle size={56} color="var(--emerald)" /></div>
            <h1>Application Submitted!</h1>
            <p>Your registration has been received. Our admin team will verify your documents and credentials within 24–48 hours. You'll be notified by email once verified.</p>
            <div className={styles.successSteps}>
              <div className={styles.successStep}><CheckCircle size={14} /> Application submitted</div>
              <div className={styles.successStep} style={{ opacity: 0.5 }}><Shield size={14} /> Admin verification (in progress)</div>
              <div className={styles.successStep} style={{ opacity: 0.5 }}><Scale size={14} /> Profile goes live</div>
            </div>
            <Link href="/" className="btn btn-primary" id="lawyer-reg-success-home">Return to Home</Link>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <div className={styles.logoRow}>
              <div className={styles.logoIcon}><Scale size={20} /></div>
              <span className={styles.logoText}>LawTalk — Lawyer Registration</span>
            </div>
            <p className={styles.headerSubtitle}>Join India's most trusted legal consultation platform</p>
          </div>

          {/* Step indicator */}
          <div className={styles.stepIndicator}>
            {STEPS.map((s, i) => (
              <div key={s.id} className={styles.stepItem}>
                <div className={`${styles.stepCircle} ${step === s.id ? styles.active : step > s.id ? styles.completed : styles.inactive}`}>
                  {step > s.id ? <CheckCircle size={16} /> : <s.icon size={15} />}
                </div>
                <span className={`${styles.stepLabel} ${step === s.id ? styles.stepLabelActive : ""}`}>{s.label}</span>
                {i < STEPS.length - 1 && (
                  <div className={`${styles.stepLine} ${step > s.id ? styles.stepLineDone : ""}`} />
                )}
              </div>
            ))}
          </div>

          {/* Form card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              className={styles.formCard}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              {/* Step 1: Personal Details */}
              {step === 1 && (
                <div>
                  <h2 className={styles.stepTitle}>Personal Details</h2>
                  <p className={styles.stepSubtitle}>Tell us about yourself</p>
                  <div className={styles.grid2}>
                    <div className="form-group">
                      <label className="form-label">Full Name (with title) *</label>
                      <input id="lreg-name" type="text" className="form-input" placeholder="e.g. Adv. Ramesh Kumar" value={form.name} onChange={(e) => update("name", e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address *</label>
                      <input id="lreg-email" type="email" className="form-input" placeholder="professional@email.com" value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password * (for login)</label>
                      <div style={{ position: "relative" }}>
                        <input id="lreg-password" type={showPass ? "text" : "password"} className="form-input" placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password} onChange={(e) => update("password", e.target.value)} style={{ paddingRight: "3rem" }} autoComplete="new-password" />
                        <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: "absolute", right: "0.85rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date of Birth *</label>
                      <input id="lreg-dob" type="date" className="form-input" value={form.dob} onChange={(e) => update("dob", e.target.value)} max={new Date(Date.now() - 21 * 365.25 * 86400000).toISOString().split("T")[0]} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">City *</label>
                      <input id="lreg-city" type="text" className="form-input" placeholder="e.g. Delhi" value={form.city} onChange={(e) => update("city", e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State *</label>
                      <select id="lreg-state" className="form-select" value={form.state} onChange={(e) => update("state", e.target.value)}>
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Professional Details */}
              {step === 2 && (
                <div>
                  <h2 className={styles.stepTitle}>Professional Details</h2>
                  <p className={styles.stepSubtitle}>Your legal credentials and expertise</p>
                  <div className={styles.fields}>
                    <div className={styles.grid2}>
                      <div className="form-group">
                        <label className="form-label">Bar Council Enrollment ID *</label>
                        <input id="lreg-bar" type="text" className="form-input" placeholder="e.g. DL/1234/2015" value={form.barCouncilId} onChange={(e) => update("barCouncilId", e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Years of Experience *</label>
                        <input id="lreg-exp" type="number" className="form-input" placeholder="e.g. 8" min={0} max={60} value={form.experience} onChange={(e) => update("experience", e.target.value)} />
                      </div>
                      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label">Educational Qualification *</label>
                        <input id="lreg-edu" type="text" className="form-input" placeholder="e.g. LLB — Delhi University (2015)" value={form.education} onChange={(e) => update("education", e.target.value)} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Specializations * (select all that apply)</label>
                      <div className={styles.checkboxGrid}>
                        {SPECIALIZATIONS.map((s) => (
                          <label key={s} className={styles.checkItem}>
                            <input type="checkbox" checked={form.specializations.includes(s)} onChange={() => toggleArray("specializations", s)} />
                            <span>{s}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Languages Spoken * (select all that apply)</label>
                      <div className={styles.langGrid}>
                        {LANGUAGES.map((l) => (
                          <label key={l} className={styles.checkItem}>
                            <input type="checkbox" checked={form.languages.includes(l)} onChange={() => toggleArray("languages", l)} />
                            <span>{l}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Professional Bio * (min. 50 characters)</label>
                      <textarea id="lreg-bio" className="form-textarea" placeholder="Describe your legal experience, areas of expertise, notable cases, and approach to client consultations..." value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={5} />
                      <span className="form-error" style={{ color: form.bio.length < 50 ? "var(--text-muted)" : "var(--emerald)", fontSize: "0.75rem" }}>
                        {form.bio.length}/50 min characters
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Pricing */}
              {step === 3 && (
                <div>
                  <h2 className={styles.stepTitle}>Pricing & Availability</h2>
                  <p className={styles.stepSubtitle}>Set your consultation rates</p>
                  <div className={styles.pricingNote}>
                    <IndianRupee size={14} />
                    <span>Note: The first consultation for every new user is always <strong>₹2</strong> regardless of your rate. This is LawTalk&apos;s introductory offer.</span>
                  </div>
                  <div className={styles.fields}>
                    <div className="form-group">
                      <label className="form-label">Your Rate (₹ per chat) *</label>
                      <div className={styles.priceInput}>
                        <span className={styles.rupeeSign}><IndianRupee size={14} /></span>
                        <input id="lreg-price" type="number" className={`form-input ${styles.priceField}`} placeholder="30" min={5} max={500} value={form.pricePerMinute} onChange={(e) => update("pricePerMinute", e.target.value)} />
                        <span className={styles.perMinLabel}>/ chat</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Availability</label>
                      <select id="lreg-avail" className="form-select" value={form.availability} onChange={(e) => update("availability", e.target.value)}>
                        <option value="always">Available anytime</option>
                        <option value="weekdays">Weekdays only (Mon–Fri)</option>
                        <option value="weekends">Weekends only (Sat–Sun)</option>
                        <option value="mornings">Mornings (9 AM – 1 PM)</option>
                        <option value="evenings">Evenings (5 PM – 9 PM)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Documents */}
              {step === 4 && (
                <div>
                  <h2 className={styles.stepTitle}>Upload Documents</h2>
                  <p className={styles.stepSubtitle}>All documents are reviewed by our admin team for verification</p>

                  <div className={styles.docNote}>
                    <Shield size={14} /> Accepted formats: JPG, PNG, PDF · Max size: 5 MB each
                  </div>

                  {[
                    { label: "Law Degree / Marksheet *", field: "marksheet", nameField: "marksheetName", id: "lreg-doc-marksheet", hint: "Upload your LLB or LLM degree certificate" },
                    { label: "Bar Council Enrollment Certificate *", field: "barCertificate", nameField: "barCertificateName", id: "lreg-doc-bar", hint: "Upload your State Bar Council enrollment certificate" },
                    { label: "Government ID Proof *", field: "idProof", nameField: "idProofName", id: "lreg-doc-id", hint: "Aadhaar card, PAN card, or Passport" },
                  ].map((doc) => (
                    <div key={doc.field} className={styles.uploadGroup}>
                      <label className="form-label">{doc.label}</label>
                      <p className={styles.uploadHint}>{doc.hint}</p>
                      <label className={`${styles.uploadZone} ${documents[doc.field] ? styles.uploadDone : ""}`} htmlFor={doc.id}>
                        <Upload size={24} color={documents[doc.field] ? "var(--emerald)" : "var(--text-muted)"} />
                        <span>{form[doc.nameField] || "Click to upload or drag & drop"}</span>
                        {documents[doc.field] && <span className={styles.uploadSuccess}><CheckCircle size={14} /> Uploaded</span>}
                        <input id={doc.id} type="file" accept="image/jpeg,image/png,image/jpg,application/pdf" onChange={(e) => handleFile(doc.field, doc.nameField, e)} style={{ display: "none" }} />
                      </label>
                    </div>
                  ))}

                  <label className={styles.termsLabel}>
                    <input type="checkbox" checked={form.agreeTerms} onChange={(e) => update("agreeTerms", e.target.checked)} id="lreg-terms" />
                    <span>
                      I agree to the{" "}
                      <Link href="/terms" target="_blank" className={styles.link}>Terms & Conditions</Link>,{" "}
                      <Link href="/privacy" target="_blank" className={styles.link}>Privacy Policy</Link>,
                      and confirm that all submitted information and documents are genuine and authentic.
                      I understand that submitting false information may result in permanent account termination and legal action.
                    </span>
                  </label>
                </div>
              )}

              {/* Step 5: Review */}
              {step === 5 && (
                <div>
                  <h2 className={styles.stepTitle}>Review Your Application</h2>
                  <p className={styles.stepSubtitle}>Please verify your details before submitting</p>

                  <div className={styles.reviewGrid}>
                    <div className={styles.reviewSection}>
                      <h4>Personal Details</h4>
                      <div className={styles.reviewItem}><span>Name</span><span>{form.name}</span></div>
                      <div className={styles.reviewItem}><span>Email</span><span>{form.email}</span></div>
                      <div className={styles.reviewItem}><span>Location</span><span>{form.city}, {form.state}</span></div>
                    </div>
                    <div className={styles.reviewSection}>
                      <h4>Professional Details</h4>
                      <div className={styles.reviewItem}><span>Bar Council ID</span><span>{form.barCouncilId}</span></div>
                      <div className={styles.reviewItem}><span>Experience</span><span>{form.experience} years</span></div>
                      <div className={styles.reviewItem}><span>Specializations</span><span>{form.specializations.slice(0, 3).join(", ")}{form.specializations.length > 3 ? ` +${form.specializations.length - 3}` : ""}</span></div>
                    </div>
                    <div className={styles.reviewSection}>
                      <h4>Pricing</h4>
                      <div className={styles.reviewItem}><span>Rate</span><span>₹{form.pricePerMinute}/chat</span></div>
                      <div className={styles.reviewItem}><span>First chat</span><span>₹2 (fixed by platform)</span></div>
                      <div className={styles.reviewItem}><span>Availability</span><span>{form.availability}</span></div>
                    </div>
                    <div className={styles.reviewSection}>
                      <h4>Documents</h4>
                      <div className={styles.reviewItem}><span>Marksheet</span><span>{form.marksheetName ? <span className={styles.docOk}><CheckCircle size={12} /> Uploaded</span> : "Missing"}</span></div>
                      <div className={styles.reviewItem}><span>Bar Certificate</span><span>{form.barCertificateName ? <span className={styles.docOk}><CheckCircle size={12} /> Uploaded</span> : "Missing"}</span></div>
                      <div className={styles.reviewItem}><span>ID Proof</span><span>{form.idProofName ? <span className={styles.docOk}><CheckCircle size={12} /> Uploaded</span> : "Missing"}</span></div>
                    </div>
                  </div>

                  <div className={styles.submitNote}>
                    <Shield size={14} />
                    After submission, our admin team will review your documents within 24–48 hours.
                    You will be notified by email once your profile is approved.
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className={styles.error}><AlertCircle size={14} /> {error}</div>
              )}

              {/* Navigation */}
              <div className={styles.navBtns}>
                {step > 1 && (
                  <button className="btn btn-ghost" onClick={prev} id="lreg-prev-btn">
                    <ArrowLeft size={16} /> Previous
                  </button>
                )}
                {step < 5 ? (
                  <button className="btn btn-primary" onClick={next} id={`lreg-next-step-${step}`} style={{ marginLeft: "auto" }}>
                    Next: {STEPS[step]?.label} <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={submitting}
                    id="lreg-submit-btn"
                    style={{ marginLeft: "auto" }}
                  >
                    {submitting ? <><span className="spinner" /> Uploading & Submitting...</> : <>Submit Application <CheckCircle size={16} /></>}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
