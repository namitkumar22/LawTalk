// ============================================================
// LAWTALK — CONSTANTS
// ============================================================
// All static configuration, enumerations, and shared values
// used across the app. Backend dev: map these to your DB enums.
// ============================================================

export const APP_NAME = "LawTalk";
export const APP_TAGLINE = "Legal Help, Just a Chat Away";

// Pricing
export const FIRST_CHAT_PRICE = 2; // ₹2 for first consultation (per session)

// Admin credentials are stored securely in Supabase (bcrypt hashed)
// Use the admin portal at /admin to login

// Lawyer specializations
export const SPECIALIZATIONS = [
  "Family Law",
  "Criminal Law",
  "Civil Law",
  "Corporate Law",
  "Property Law",
  "Labour Law",
  "Intellectual Property",
  "Tax Law",
  "Constitutional Law",
  "Consumer Law",
  "Divorce & Matrimonial",
  "NRI Legal Services",
  "Immigration Law",
  "Cyber Law",
  "Debt Recovery",
];

// Languages supported by lawyers
export const LANGUAGES = [
  "English",
  "Hindi",
  "Bengali",
  "Telugu",
  "Marathi",
  "Tamil",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Odia",
  "Urdu",
];

// Experience ranges for filtering
export const EXPERIENCE_RANGES = [
  { label: "0–3 years", min: 0, max: 3 },
  { label: "3–7 years", min: 3, max: 7 },
  { label: "7–15 years", min: 7, max: 15 },
  { label: "15+ years", min: 15, max: 100 },
];

// Price per chat ranges for filtering
export const PRICE_RANGES = [
  { label: "₹0–₹20/chat", min: 0, max: 20 },
  { label: "₹20–₹50/chat", min: 20, max: 50 },
  { label: "₹50–₹100/chat", min: 50, max: 100 },
  { label: "₹100+/chat", min: 100, max: 9999 },
];

// Lawyer verification statuses
export const LAWYER_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
};

// Legacy localStorage keys (kept for backward compatibility during migration)
export const LS_KEYS = {
  ADMIN: "lawtalk_admin_token", // admin session token only
};

// Navigation links
export const NAV_LINKS = [
  { label: "Find a Lawyer", href: "/lawyers" },
  { label: "How it Works", href: "/#how-it-works" },
  { label: "For Lawyers", href: "/lawyer/register" },
];
