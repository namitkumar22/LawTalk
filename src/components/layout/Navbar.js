"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale, Menu, X, ChevronDown, User, LogOut, LayoutDashboard,
  Wallet, Search, Gavel, Bell, Settings, Shield
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { APP_NAME } from "@/lib/constants";
import styles from "./Navbar.module.css";

// ── Nav config per role ──────────────────────────────────────
const PUBLIC_LINKS = [
  { label: "Find a Lawyer", href: "/lawyers" },
  { label: "How it Works", href: "/#how-it-works" },
  { label: "For Lawyers", href: "/lawyer/register" },
];

const USER_LINKS = [
  { label: "Find a Lawyer", href: "/lawyers" },
  { label: "How it Works", href: "/#how-it-works" },
];

const LAWYER_LINKS = [
  { label: "My Dashboard", href: "/lawyer/dashboard" },
  { label: "Consultation Guide", href: "/#how-it-works" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef(null);

  const isLawyer = user?.role === "lawyer";
  const isUser = isAuthenticated && !isLawyer;

  const navLinks = isLawyer ? LAWYER_LINKS : isAuthenticated ? USER_LINKS : PUBLIC_LINKS;
  const dashboardHref = isLawyer ? "/lawyer/dashboard" : "/dashboard";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = (href) => pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  const getInitials = (name) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
        <div className={`container ${styles.inner}`}>
          {/* Logo */}
          <Link href={isAuthenticated ? dashboardHref : "/"} className={styles.logo}>
            <div className={styles.logoIcon}>
              <Scale size={20} strokeWidth={2.5} />
            </div>
            <span className={styles.logoText}>{APP_NAME}</span>
          </Link>

          {/* Desktop nav links */}
          <ul className={styles.navLinks}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${styles.navLink} ${isActive(link.href) ? styles.navLinkActive : ""}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className={styles.right}>
            {!loading && (
              <>
                {isAuthenticated ? (
                  <div className={styles.userMenu} ref={menuRef}>
                    {/* Wallet chip — users only */}
                    {isUser && (
                      <Link
                        href="/dashboard"
                        className={styles.walletChip}
                        id="navbar-wallet-chip"
                        title="Your wallet balance"
                      >
                        <Wallet size={13} />
                        <span>₹{user?.walletBalance ?? 0}</span>
                      </Link>
                    )}

                    {/* Avatar + name trigger */}
                    <button
                      className={styles.userBtn}
                      onClick={() => setUserMenuOpen((v) => !v)}
                      aria-label="User menu"
                      id="navbar-user-menu-trigger"
                    >
                      <div className={`avatar avatar-sm ${isLawyer ? styles.lawyerAvatar : ""}`}>
                        {getInitials(user?.name)}
                      </div>
                      <span className={styles.userName}>{user?.name?.split(" ")[0]}</span>
                      <ChevronDown size={14} className={userMenuOpen ? styles.chevronUp : ""} />
                    </button>

                    {/* Dropdown */}
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          className={styles.dropdown}
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                        >
                          {/* Header */}
                          <div className={styles.dropdownHeader}>
                            <div className={`avatar avatar-md ${isLawyer ? styles.lawyerAvatar : ""}`}>
                              {getInitials(user?.name)}
                            </div>
                            <div>
                              <p className={styles.ddName}>{user?.name}</p>
                              <p className={styles.ddRole}>
                                {isLawyer ? (
                                  <><Gavel size={11} /> Lawyer Account</>
                                ) : (
                                  <><User size={11} /> User Account</>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className={styles.ddDivider} />

                          {/* Dashboard */}
                          <Link href={dashboardHref} className={styles.ddItem} id="navbar-dd-dashboard">
                            <LayoutDashboard size={15} /> Dashboard
                          </Link>

                          {/* Wallet (users only) */}
                          {isUser && (
                            <Link href="/dashboard" className={styles.ddItem} id="navbar-dd-wallet">
                              <Wallet size={15} />
                              <span style={{ flex: 1 }}>Wallet</span>
                              <span style={{ fontSize: "0.78rem", color: "var(--gold-400)", fontWeight: 700 }}>
                                ₹{user?.walletBalance ?? 0}
                              </span>
                            </Link>
                          )}

                          <div className={styles.ddDivider} />

                          {/* Logout */}
                          <button
                            className={`${styles.ddItem} ${styles.ddLogout}`}
                            onClick={handleLogout}
                            id="navbar-logout-btn"
                          >
                            <LogOut size={15} /> Sign Out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  // Logged-out CTA
                  <div className={styles.authBtns}>
                    <Link href="/login" className="btn btn-ghost btn-sm" id="navbar-signin-btn">
                      Sign In
                    </Link>
                    <Link href="/register" className="btn btn-primary btn-sm" id="navbar-register-btn">
                      Get Started
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Hamburger */}
            <button
              className={styles.hamburger}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              id="navbar-hamburger"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className={styles.mobileMenu}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className={styles.mobileInner}>
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={link.href}
                    className={`${styles.mobileLink} ${isActive(link.href) ? styles.mobileLinkActive : ""}`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <div className={styles.mobileDivider} />

              {isAuthenticated ? (
                <>
                  {/* Mobile user info */}
                  <div className={styles.mobileUserInfo}>
                    <div className={`avatar avatar-sm ${isLawyer ? styles.lawyerAvatar : ""}`}>
                      {getInitials(user?.name)}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>{user?.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{isLawyer ? "Lawyer" : "User"} Account</p>
                    </div>
                  </div>
                  <div className={styles.mobileDivider} />
                  <Link href={dashboardHref} className={styles.mobileLink} id="mobile-dashboard-link">
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  {isUser && (
                    <Link href="/dashboard" className={styles.mobileLink} id="mobile-wallet-link">
                      <Wallet size={16} /> Wallet — ₹{user?.walletBalance ?? 0}
                    </Link>
                  )}
                  <button
                    className={`${styles.mobileLink} ${styles.ddLogout}`}
                    onClick={handleLogout}
                    id="mobile-logout-btn"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </>
              ) : (
                <div className={styles.mobileBtns}>
                  <Link href="/login" className="btn btn-ghost" style={{ flex: 1 }} id="mobile-signin-btn">
                    Sign In
                  </Link>
                  <Link href="/register" className="btn btn-primary" style={{ flex: 1 }} id="mobile-register-btn">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div style={{ height: "var(--navbar-height)" }} />
    </>
  );
}
