"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Shield, Clock, Star, IndianRupee } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./Hero.module.css";

const ROTATING_TEXTS = [
  "Family Disputes",
  "Property Issues",
  "Criminal Cases",
  "Business Legal Needs",
  "Labour Problems",
  "Consumer Rights",
];

const TRUST_STATS = [
  { icon: Shield, value: "5,000+", label: "Verified Lawyers" },
  { icon: Star, value: "4.8★", label: "Average Rating" },
  { icon: Clock, value: "24/7", label: "Available" },
  { icon: IndianRupee, value: "₹2", label: "First Chat" },
];

export default function Hero() {
  const [textIndex, setTextIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(true);

  // Typewriter effect
  useEffect(() => {
    const target = ROTATING_TEXTS[textIndex];
    if (typing) {
      if (displayed.length < target.length) {
        const t = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 60);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setTyping(false), 1800);
        return () => clearTimeout(t);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
        return () => clearTimeout(t);
      } else {
        setTextIndex((i) => (i + 1) % ROTATING_TEXTS.length);
        setTyping(true);
      }
    }
  }, [displayed, typing, textIndex]);

  return (
    <section className={styles.hero}>
      {/* Particles */}
      <div className={styles.particles}>
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className={styles.particle}
            style={{
              left: `${Math.random() * 100}%`,
              width: `${3 + Math.random() * 5}px`,
              height: `${3 + Math.random() * 5}px`,
              animationDuration: `${8 + Math.random() * 15}s`,
              animationDelay: `${Math.random() * 10}s`,
              opacity: 0.08 + Math.random() * 0.12,
            }}
          />
        ))}
      </div>

      {/* Background glow orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />
      <div className={styles.orb3} />

      <div className={`container ${styles.content}`}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={styles.textBlock}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={styles.launchBadge}
          >
            <span className={styles.badgeDot} />
            India's Most Trusted Legal Platform
          </motion.div>

          {/* Headline */}
          <h1 className={styles.headline}>
            Get Expert Legal Help
            <br />
            for Your{" "}
            <span className={`gradient-text ${styles.rotating}`}>
              {displayed}
              <span className={styles.cursor}>|</span>
            </span>
          </h1>

          <p className={styles.subheadline}>
            Connect with India's top verified lawyers via live chat.
            <br />
            First consultation starts at just{" "}
            <strong className={styles.priceHighlight}>₹2</strong>.
            No appointments. No waiting rooms.
          </p>

          {/* CTA Buttons */}
          <motion.div
            className={styles.ctaBtns}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link href="/lawyers" className={`btn btn-primary btn-lg ${styles.ctaPrimary}`} id="hero-find-lawyer-btn">
              Find a Lawyer <ArrowRight size={18} />
            </Link>
            <Link href="/lawyer/register" className="btn btn-secondary btn-lg" id="hero-join-lawyer-btn">
              Join as Lawyer
            </Link>
          </motion.div>

          {/* Trust stats */}
          <motion.div
            className={styles.statsRow}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {TRUST_STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className={styles.statItem}>
                <div className={styles.statIcon}>
                  <Icon size={16} />
                </div>
                <div>
                  <div className={styles.statValue}>{value}</div>
                  <div className={styles.statLabel}>{label}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Hero visual */}
        <motion.div
          className={styles.visual}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className={styles.chatCard}>
            <div className={styles.chatHeader}>
              <div className="avatar avatar-md">PS</div>
              <div>
                <p className={styles.chatName}>Adv. Priya Sharma</p>
                <p className={styles.chatSpec}>Family Law Specialist</p>
              </div>
              <span className="badge badge-green">
                <span className="online-dot" style={{ width: 6, height: 6 }} />
                Online
              </span>
            </div>
            <div className={styles.chatMessages}>
              <div className={styles.msgIn}>
                Hello! How can I help you today?
              </div>
              <div className={styles.msgOut}>
                I have a property dispute with my neighbour.
              </div>
              <div className={styles.msgIn}>
                I can definitely help with that. Let's discuss the details...
              </div>
              <div className={styles.typing}>
                <span /><span /><span />
              </div>
            </div>
            <div className={styles.chatFooter}>
              <div className={styles.firstChatBanner}>
                <IndianRupee size={13} /> First chat only ₹2
              </div>
            </div>
          </div>

          {/* Floating lawyer cards */}
          <motion.div
            className={styles.floatCard}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className={styles.floatStat}>
              <span className="gradient-text" style={{ fontSize: "1.4rem", fontWeight: 800 }}>98%</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Success Rate</span>
            </div>
          </motion.div>

          <motion.div
            className={styles.floatCard2}
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <Shield size={14} color="var(--gold-400)" />
            <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>100% Verified</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
