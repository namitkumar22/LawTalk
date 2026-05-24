"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Star, Clock, ChevronRight, IndianRupee } from "lucide-react";
import { useLawyers } from "@/context/LawyerContext";
import styles from "./LawyerCarousel.module.css";

function LawyerCard({ lawyer, index }) {
  const initials = lawyer.name
    .replace("Adv. ", "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -6 }}
    >
      <div className={styles.top}>
        <div className={styles.avatarWrap}>
          <div className="avatar avatar-lg">{initials}</div>
          {lawyer.isOnline && (
            <span className={styles.onlineBadge}>
              <span className="online-dot" />
            </span>
          )}
        </div>
        <div className={styles.info}>
          <h4 className={styles.name}>{lawyer.name}</h4>
          <div className={styles.rating}>
            <Star size={13} fill="var(--gold-400)" color="var(--gold-400)" />
            <span>{lawyer.rating.toFixed(1)}</span>
            <span className={styles.reviewCount}>({lawyer.reviewCount})</span>
          </div>
          <div className={styles.exp}>
            <Clock size={12} />
            {lawyer.experience} yrs experience
          </div>
        </div>
        <div className={styles.price}>
          <IndianRupee size={12} />
          <span>{lawyer.pricePerMinute}</span>
          <span className={styles.perMin}>/chat</span>
        </div>
      </div>

      <div className={styles.specializations}>
        {lawyer.specializations.slice(0, 2).map((s) => (
          <span key={s} className="badge badge-gold" style={{ fontSize: "0.7rem" }}>
            {s}
          </span>
        ))}
        {lawyer.specializations.length > 2 && (
          <span className="badge badge-gray" style={{ fontSize: "0.7rem" }}>
            +{lawyer.specializations.length - 2}
          </span>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.city}>{lawyer.city}</span>
        <Link
          href={`/lawyers/${lawyer.id}`}
          className="btn btn-primary btn-sm"
          id={`home-lawyer-card-${lawyer.id}`}
        >
          Chat Now <ChevronRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
}

export default function LawyerCarousel() {
  const { verifiedLawyers } = useLawyers();
  const featured = verifiedLawyers.slice(0, 6);

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <div className="overline">Top Rated Lawyers</div>
          <h2>
            Connect with <span className="gradient-text">Expert Lawyers</span>
          </h2>
          <p style={{ color: "var(--text-muted)", marginTop: "var(--space-3)" }}>
            All lawyers are thoroughly verified by our admin team
          </p>
        </div>

        {featured.length > 0 ? (
          <div className={styles.grid}>
            {featured.map((lawyer, i) => (
              <LawyerCard key={lawyer.id} lawyer={lawyer} index={i} />
            ))}
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading lawyers...</p>
        )}

        <div style={{ textAlign: "center", marginTop: "var(--space-10)" }}>
          <Link href="/lawyers" className="btn btn-secondary btn-lg" id="home-view-all-lawyers-btn">
            View All Lawyers <ChevronRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
