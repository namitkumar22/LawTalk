import Link from "next/link";
import { Scale, Mail, Phone, MapPin, Shield, FileText, Lock } from "lucide-react";
import { APP_NAME, SPECIALIZATIONS } from "@/lib/constants";
import styles from "./Footer.module.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      {/* Gold gradient divider */}
      <div className="divider-gold" style={{ margin: 0 }} />

      <div className={`container ${styles.inner}`}>
        {/* Brand column */}
        <div className={styles.brand}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <Scale size={20} strokeWidth={2.5} />
            </div>
            <span className={styles.logoText}>{APP_NAME}</span>
          </div>
          <p className={styles.tagline}>
            India's trusted platform to connect with verified lawyers. Expert legal advice, anytime.
          </p>
          <div className={styles.trustBadges}>
            <span className="badge badge-gold"><Shield size={11} />Verified Lawyers</span>
            <span className="badge badge-green"><Lock size={11} />Secure Chat</span>
          </div>
          <div className={styles.contact}>
            <a href="mailto:support@lawtalk.in" className={styles.contactItem}>
              <Mail size={14} /> support@lawtalk.in
            </a>
            <a href="tel:+911800000000" className={styles.contactItem}>
              <Phone size={14} /> 1800-000-0000 (Toll Free)
            </a>
            <span className={styles.contactItem}>
              <MapPin size={14} /> New Delhi, India
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div className={styles.column}>
          <h4 className={styles.colTitle}>Quick Links</h4>
          <ul className={styles.linkList}>
            <li><Link href="/lawyers">Find a Lawyer</Link></li>
            <li><Link href="/lawyer/register">Register as Lawyer</Link></li>
            <li><Link href="/register">Create Account</Link></li>
            <li><Link href="/login">Sign In</Link></li>
            <li><Link href="/#how-it-works">How It Works</Link></li>
          </ul>
        </div>

        {/* Specializations */}
        <div className={styles.column}>
          <h4 className={styles.colTitle}>Practice Areas</h4>
          <ul className={styles.linkList}>
            {SPECIALIZATIONS.slice(0, 8).map((s) => (
              <li key={s}>
                <Link href={`/lawyers?specialization=${encodeURIComponent(s)}`}>{s}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div className={styles.column}>
          <h4 className={styles.colTitle}>Legal & Policies</h4>
          <ul className={styles.linkList}>
            <li><Link href="/terms"><FileText size={13} />Terms &amp; Conditions</Link></li>
            <li><Link href="/privacy"><Shield size={13} />Privacy Policy</Link></li>
          </ul>
          <div className={styles.disclaimer}>
            <p>
              <strong>Disclaimer:</strong> LawTalk is a technology platform connecting users with independent legal practitioners. We do not provide legal advice ourselves.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className="container">
          <div className={styles.bottomInner}>
            <p className={styles.copyright}>
              © {currentYear} {APP_NAME}. All rights reserved. Made in India 🇮🇳
            </p>
            <div className={styles.bottomLinks}>
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
