/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [],
  },

  // ── Security Headers ──────────────────────────────────────────
  // Protects against XSS, clickjacking, data sniffing, and MITM attacks.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Enable XSS protection
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Referrer policy
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions policy (disable mic/cam/geolocation unless needed)
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Force HTTPS (HSTS) — 1 year
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Supabase API + realtime
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              // Scripts: self + framer-motion inline (Next.js needs unsafe-inline for hydration)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Styles: allow Google Fonts + self inline
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts: Google Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + Supabase storage
              "img-src 'self' data: blob: https://*.supabase.co",
              // No object embeds
              "object-src 'none'",
              // Base URI restriction
              "base-uri 'self'",
              // Form posts only to self
              "form-action 'self'",
              // Frame ancestors — prevent embedding in iframes
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      // API routes: extra cache-control (no-store for auth/sensitive endpoints)
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
};

export default nextConfig;
