"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Menu, X, ChevronDown, User, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { NAV_LINKS, APP_NAME } from "@/lib/constants";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  const getInitials = (name) =>
    name
      ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
      : "U";

  const getDashboardLink = () => {
    if (user?.role === "lawyer") return "/lawyer/dashboard";
    return "/dashboard";
  };

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
        <div className={`container ${styles.inner}`}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <Scale size={20} strokeWidth={2.5} />
            </div>
            <span className={styles.logoText}>{APP_NAME}</span>
          </Link>

          {/* Desktop Navigation */}
          <ul className={styles.navLinks}>
            {NAV_LINKS.map((link) => (
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
            {isAuthenticated ? (
              <div className={styles.userMenu} ref={menuRef}>
                <button
                  className={styles.userBtn}
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-label="User menu"
                  id="navbar-user-menu-trigger"
                >
                  <div className="avatar avatar-sm">
                    {getInitials(user?.name)}
                  </div>
                  <span className={styles.userName}>{user?.name?.split(" ")[0]}</span>
                  <ChevronDown
                    size={14}
                    className={userMenuOpen ? styles.chevronUp : ""}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      className={styles.dropdown}
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className={styles.dropdownHeader}>
                        <div className="avatar avatar-md">{getInitials(user?.name)}</div>
                        <div>
                          <p className={styles.ddName}>{user?.name}</p>
                          <p className={styles.ddRole}>
                            {user?.role === "lawyer" ? "Lawyer" : "User"} Account
                          </p>
                        </div>
                      </div>
                      <div className={styles.ddDivider} />
                      <Link href={getDashboardLink()} className={styles.ddItem}>
                        <LayoutDashboard size={15} /> Dashboard
                      </Link>
                      <Link href={getDashboardLink()} className={styles.ddItem}>
                        <User size={15} /> My Profile
                      </Link>
                      <div className={styles.ddDivider} />
                      <button
                        className={`${styles.ddItem} ${styles.ddLogout}`}
                        onClick={logout}
                        id="navbar-logout-btn"
                      >
                        <LogOut size={15} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className={styles.authBtns}>
                <Link href="/login" className="btn btn-ghost btn-sm">
                  Sign In
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm" id="navbar-register-btn">
                  Get Started
                </Link>
              </div>
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

      {/* Mobile menu */}
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
              {NAV_LINKS.map((link, i) => (
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
                  <Link href={getDashboardLink()} className={styles.mobileLink}>
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <button className={`${styles.mobileLink} ${styles.ddLogout}`} onClick={logout}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </>
              ) : (
                <div className={styles.mobileBtns}>
                  <Link href="/login" className="btn btn-ghost" style={{ flex: 1 }}>
                    Sign In
                  </Link>
                  <Link href="/register" className="btn btn-primary" style={{ flex: 1 }}>
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
