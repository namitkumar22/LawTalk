"use client";

import { motion } from "framer-motion";
import { UserPlus, CheckCircle, MessageSquare, ArrowRight } from "lucide-react";
import styles from "./HowItWorks.module.css";

const STEPS = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Your Account",
    description:
      "Sign up in 60 seconds with your phone number and basic details. Your information is safe and encrypted.",
    color: "rgba(201, 168, 76, 0.15)",
    iconColor: "var(--gold-400)",
  },
  {
    icon: CheckCircle,
    step: "02",
    title: "Choose Your Lawyer",
    description:
      "Browse verified lawyers by specialization, rating, language, and price. Read reviews from real clients.",
    color: "rgba(16, 185, 129, 0.12)",
    iconColor: "var(--emerald-light)",
  },
  {
    icon: MessageSquare,
    step: "03",
    title: "Start Chatting",
    description:
      "Confirm ₹2 payment and start instantly. Get expert legal advice from India's top verified lawyers in real-time.",
    color: "rgba(139, 92, 246, 0.12)",
    iconColor: "var(--violet)",
  },
];

export default function HowItWorks() {
  return (
    <section className={`section ${styles.section}`} id="how-it-works">
      <div className="container">
        <div className="section-header">
          <div className="overline">Simple & Transparent</div>
          <h2>
            Get Legal Help in <span className="gradient-text">3 Easy Steps</span>
          </h2>
          <p style={{ color: "var(--text-muted)", marginTop: "var(--space-4)", maxWidth: 520, margin: "var(--space-4) auto 0" }}>
            No complex procedures. No hidden charges. Just straightforward access to expert legal advice.
          </p>
        </div>

        <div className={styles.steps}>
          {STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              className={styles.stepCard}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <div className={styles.stepNum}>{step.step}</div>
              <div
                className={styles.iconWrap}
                style={{ background: step.color }}
              >
                <step.icon size={28} color={step.iconColor} strokeWidth={1.8} />
              </div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.description}</p>

              {i < STEPS.length - 1 && (
                <div className={styles.connector}>
                  <ArrowRight size={18} color="var(--text-muted)" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom highlight */}
        <motion.div
          className={styles.highlight}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <div className={styles.highlightInner}>
            <div className={styles.badge}>
              ₹2
            </div>
            <div>
              <p className={styles.highlightTitle}>First Consultation, Just ₹2</p>
              <p className={styles.highlightSub}>
                Your first chat with any lawyer is only ₹2. Subsequent chats are charged at the lawyer's rate per chat.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
