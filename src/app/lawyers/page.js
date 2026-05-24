"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search, Filter, Star, Clock, IndianRupee, ChevronRight,
  X, SlidersHorizontal, MapPin, Globe
} from "lucide-react";
import { useLawyers } from "@/context/LawyerContext";
import { SPECIALIZATIONS, EXPERIENCE_RANGES, PRICE_RANGES, LANGUAGES } from "@/lib/constants";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import styles from "./page.module.css";

// Backend dev:
// GET /api/lawyers?status=verified&specialization=X&experience=Y&priceMin=A&priceMax=B&language=L&q=search&page=1&limit=12
// Returns: { lawyers: [...], total, page, totalPages }

function LawyerCard({ lawyer, index }) {
  const initials = lawyer.name.replace("Adv. ", "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
    >
      <div className={styles.cardTop}>
        <div className={styles.avatarWrap}>
          <div className={`avatar avatar-lg ${styles.avatar}`}>{initials}</div>
          {lawyer.isOnline && (
            <span className={styles.onlineDot}><span className="online-dot" /></span>
          )}
        </div>
        <div className={styles.cardInfo}>
          <h3 className={styles.cardName}>{lawyer.name}</h3>
          <div className={styles.cardRating}>
            <Star size={13} fill="var(--gold-400)" color="var(--gold-400)" />
            <span>{lawyer.rating.toFixed(1)}</span>
            <span className={styles.reviews}>({lawyer.reviewCount} reviews)</span>
          </div>
          <div className={styles.cardMeta}>
            <span className={styles.metaItem}><Clock size={12} />{lawyer.experience} yrs exp.</span>
            <span className={styles.metaItem}><MapPin size={12} />{lawyer.city}</span>
          </div>
          <div className={styles.cardLangs}>
            <Globe size={11} />
            {lawyer.languages.slice(0, 3).join(", ")}
          </div>
        </div>
        <div className={styles.cardPrice}>
          <div className={styles.priceAmount}>
            <IndianRupee size={14} />{lawyer.pricePerMinute}
          </div>
          <div className={styles.perMin}>per chat</div>
          <div className={styles.firstChat}>₹2 first chat</div>
        </div>
      </div>

      <div className={styles.cardSpecs}>
        {lawyer.specializations.map((s) => (
          <span key={s} className="badge badge-gold" style={{ fontSize: "0.7rem" }}>{s}</span>
        ))}
      </div>

      <p className={styles.cardBio}>{lawyer.bio.slice(0, 110)}...</p>

      <div className={styles.cardFooter}>
        <div className={styles.consultCount}>
          {lawyer.totalConsultations.toLocaleString()} consultations
        </div>
        <div className={styles.cardActions}>
          <Link
            href={`/lawyers/${lawyer.id}`}
            className="btn btn-ghost btn-sm"
            id={`lawyers-view-${lawyer.id}`}
          >
            View Profile
          </Link>
          <Link
            href={`/lawyers/${lawyer.id}`}
            className="btn btn-primary btn-sm"
            id={`lawyers-chat-${lawyer.id}`}
          >
            Chat <IndianRupee size={12} />2 <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function LawyersPageContent() {
  const { verifiedLawyers } = useLawyers();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    specialization: searchParams.get("specialization") || "",
    experience: "",
    priceRange: "",
    language: "",
    onlineOnly: false,
    sortBy: "rating",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    let result = [...verifiedLawyers];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.specializations.some((s) => s.toLowerCase().includes(q)) ||
          l.city.toLowerCase().includes(q) ||
          l.bio.toLowerCase().includes(q)
      );
    }

    if (filters.specialization) {
      result = result.filter((l) => l.specializations.includes(filters.specialization));
    }

    if (filters.experience) {
      const range = EXPERIENCE_RANGES.find((r) => r.label === filters.experience);
      if (range) result = result.filter((l) => l.experience >= range.min && l.experience <= range.max);
    }

    if (filters.priceRange) {
      const range = PRICE_RANGES.find((r) => r.label === filters.priceRange);
      if (range) result = result.filter((l) => l.pricePerMinute >= range.min && l.pricePerMinute <= range.max);
    }

    if (filters.language) {
      result = result.filter((l) => l.languages.includes(filters.language));
    }

    if (filters.onlineOnly) {
      result = result.filter((l) => l.isOnline);
    }

    // Sort
    if (filters.sortBy === "rating") result.sort((a, b) => b.rating - a.rating);
    else if (filters.sortBy === "experience") result.sort((a, b) => b.experience - a.experience);
    else if (filters.sortBy === "price_low") result.sort((a, b) => a.pricePerMinute - b.pricePerMinute);
    else if (filters.sortBy === "price_high") result.sort((a, b) => b.pricePerMinute - a.pricePerMinute);
    else if (filters.sortBy === "consultations") result.sort((a, b) => b.totalConsultations - a.totalConsultations);

    setFiltered(result);
  }, [search, filters, verifiedLawyers]);

  const clearFilters = () => {
    setFilters({ specialization: "", experience: "", priceRange: "", language: "", onlineOnly: false, sortBy: "rating" });
    setSearch("");
  };

  const activeFilterCount = [
    filters.specialization, filters.experience, filters.priceRange, filters.language, filters.onlineOnly,
  ].filter(Boolean).length;

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className={styles.pageTitle}>
                Find Your <span className="gradient-text">Legal Expert</span>
              </h1>
              <p className={styles.pageSubtitle}>
                {filtered.length} verified lawyers available
              </p>
            </motion.div>

            {/* Search bar */}
            <div className={styles.searchBar}>
              <Search size={18} className={styles.searchIcon} />
              <input
                id="lawyers-search-input"
                type="text"
                placeholder="Search by name, specialization, or city..."
                className={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className={styles.clearSearch} onClick={() => setSearch("")}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="container">
          <div className={styles.layout}>
            {/* Sidebar filters */}
            <aside className={`${styles.sidebar} ${showFilters ? styles.sidebarOpen : ""}`}>
              <div className={styles.sidebarHeader}>
                <h3>Filters</h3>
                {activeFilterCount > 0 && (
                  <button className={styles.clearBtn} onClick={clearFilters}>
                    Clear all ({activeFilterCount})
                  </button>
                )}
              </div>

              {/* Sort */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Sort By</label>
                <select
                  className="form-select"
                  value={filters.sortBy}
                  onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
                  id="lawyers-sort"
                >
                  <option value="rating">Highest Rated</option>
                  <option value="experience">Most Experienced</option>
                  <option value="consultations">Most Consultations</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>

              {/* Online only */}
              <div className={styles.filterGroup}>
                <label className={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={filters.onlineOnly}
                    onChange={(e) => setFilters((f) => ({ ...f, onlineOnly: e.target.checked }))}
                    id="lawyers-filter-online"
                  />
                  <span className={styles.toggleInner}>
                    <span className="online-dot" style={{ width: 8, height: 8 }} />
                    Online Now Only
                  </span>
                </label>
              </div>

              {/* Specialization */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Specialization</label>
                <select
                  className="form-select"
                  value={filters.specialization}
                  onChange={(e) => setFilters((f) => ({ ...f, specialization: e.target.value }))}
                  id="lawyers-filter-spec"
                >
                  <option value="">All Specializations</option>
                  {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Experience */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Experience</label>
                <select
                  className="form-select"
                  value={filters.experience}
                  onChange={(e) => setFilters((f) => ({ ...f, experience: e.target.value }))}
                  id="lawyers-filter-exp"
                >
                  <option value="">Any Experience</option>
                  {EXPERIENCE_RANGES.map((r) => <option key={r.label} value={r.label}>{r.label}</option>)}
                </select>
              </div>

              {/* Price */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Price Range</label>
                <select
                  className="form-select"
                  value={filters.priceRange}
                  onChange={(e) => setFilters((f) => ({ ...f, priceRange: e.target.value }))}
                  id="lawyers-filter-price"
                >
                  <option value="">Any Price</option>
                  {PRICE_RANGES.map((r) => <option key={r.label} value={r.label}>{r.label}</option>)}
                </select>
              </div>

              {/* Language */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Language</label>
                <select
                  className="form-select"
                  value={filters.language}
                  onChange={(e) => setFilters((f) => ({ ...f, language: e.target.value }))}
                  id="lawyers-filter-lang"
                >
                  <option value="">Any Language</option>
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </aside>

            {/* Main content */}
            <main className={styles.main}>
              {/* Mobile filter toggle */}
              <div className={styles.mobileFilterBar}>
                <button
                  className={`btn btn-ghost btn-sm ${styles.filterToggle}`}
                  onClick={() => setShowFilters((v) => !v)}
                  id="lawyers-filter-toggle"
                >
                  <SlidersHorizontal size={15} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className={styles.filterCount}>{activeFilterCount}</span>
                  )}
                </button>
                <span className={styles.resultCount}>{filtered.length} lawyers found</span>
              </div>

              {filtered.length === 0 ? (
                <div className={styles.empty}>
                  <Search size={48} color="var(--text-muted)" />
                  <h3>No lawyers found</h3>
                  <p>Try adjusting your filters or search query</p>
                  <button className="btn btn-secondary" onClick={clearFilters}>Clear All Filters</button>
                </div>
              ) : (
                <div className={styles.cardGrid}>
                  {filtered.map((l, i) => (
                    <LawyerCard key={l.id} lawyer={l} index={i} />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function LawyersPage() {
  return (
    <Suspense fallback={null}>
      <LawyersPageContent />
    </Suspense>
  );
}
