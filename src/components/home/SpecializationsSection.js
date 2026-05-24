"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SPECIALIZATIONS } from "@/lib/constants";
import { Scale, Users, Building, Home, Briefcase, Gavel, Shield, Globe } from "lucide-react";
import styles from "./SpecializationsSection.module.css";

const SPEC_ICONS = {
  "Family Law": Home,
  "Criminal Law": Gavel,
  "Civil Law": Scale,
  "Corporate Law": Briefcase,
  "Property Law": Building,
  "Labour Law": Users,
  "Intellectual Property": Shield,
  "Tax Law": Scale,
  "Constitutional Law": Scale,
  "Consumer Law": Users,
  "Divorce & Matrimonial": Home,
  "NRI Legal Services": Globe,
  "Immigration Law": Globe,
  "Cyber Law": Shield,
  "Debt Recovery": Briefcase,
};

export default function SpecializationsSection() {
  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className="section-header">
          <div className="overline">All Practice Areas</div>
          <h2>
            Find Lawyers by <span className="gradient-text">Specialization</span>
          </h2>
        </div>

        <div className={styles.grid}>
          {SPECIALIZATIONS.map((spec, i) => {
            const Icon = SPEC_ICONS[spec] || Scale;
            return (
              <motion.div
                key={spec}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/lawyers?specialization=${encodeURIComponent(spec)}`}
                  className={styles.specCard}
                  id={`spec-${spec.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className={styles.specIcon}>
                    <Icon size={20} strokeWidth={1.8} />
                  </div>
                  <span className={styles.specName}>{spec}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
