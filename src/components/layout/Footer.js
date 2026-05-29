"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Scale, Mail, Phone, MapPin, Shield, FileText, Lock, LayoutDashboard, Gavel, Search } from "lucide-react";
import { APP_NAME, SPECIALIZATIONS } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import styles from "./Footer.module.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { user, isAuthenticated } = useAuth();
  const isLawyer = user?.role === "lawyer";
  const isUser = isAuthenticated && !isLawyer;

  // Role-aware quick links
  const quickLinks = isLawyer
    ? [
        { label: "My Dashboard", href: "/lawyer/dashboard", icon: LayoutDashboard },
        { label: "Find Lawyers", href: "/lawyers", icon: Search },
        { label: "How It Works", href: "/#how-it-works", icon: null },
      ]
    : isUser
    ? [
        { label: "My Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Find a Lawyer", href: "/lawyers", icon: null },
        { label: "How It Works", href: "/#how-it-works", icon: null },
      ]
    : [
        { label: "Find a Lawyer", href: "/lawyers", icon: null },
        { label: "Register as Lawyer", href: "/lawyer/register", icon: null },
        { label: "Create Account", href: "/register", icon: null },
        { label: "Sign In", href: "/login", icon: null },
        { label: "How It Works", href: "/#how-it-works", icon: null },
      ];

  return (
    <footer className={styles.footer}>
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
            <a href="mailto:support.lawtalk@gmail.com" className={styles.contactItem}>
              <Mail size={14} /> support.lawtalk@gmail.com
            </a>
            <a href="tel:+918958795103" className={styles.contactItem}>
              <Phone size={14} /> +91 8958795103
            </a>
            <span className={styles.contactItem}>
              <MapPin size={14} /> Uttar Pradesh, India
            </span>
          </div>
        </div>

        {/* Quick Links — role-aware */}
        <div className={styles.column}>
          <h4 className={styles.colTitle}>Quick Links</h4>
          <ul className={styles.linkList}>
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
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
