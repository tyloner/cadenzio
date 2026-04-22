import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
      { protocol: "https", hostname: "*.supabase.co" },              // Supabase storage
      { protocol: "https", hostname: "tonejs.github.io" },           // Piano sample previews
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year — images are content-addressed
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [32, 64, 96, 128, 256],
  },
  headers: async () => [
    // Security headers on all routes
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options",    value: "nosniff" },
        { key: "X-Frame-Options",           value: "DENY" },
        { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy",        value: "geolocation=(self), camera=(), microphone=()" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // Next.js inline scripts + RSC payloads need 'self'; Tone.js audio worklets need 'unsafe-eval'
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            // Supabase storage + Google avatar CDN
            "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.supabase.co",
            // Tone.js sample audio (GitHub CDN) + self for recorded blobs
            "media-src 'self' blob: https://tonejs.github.io",
            // Supabase DB + Auth + Storage, Google OAuth
            "connect-src 'self' https://*.supabase.co https://accounts.google.com wss://*.supabase.co",
            // Fonts served from self (Geist loaded via next/font)
            "font-src 'self'",
            // Leaflet tiles + OG images rendered server-side (no external frames needed)
            "frame-src 'none'",
            // Inline styles from Leaflet + Tailwind
            "style-src 'self' 'unsafe-inline'",
            // Service worker scope
            "worker-src 'self'",
          ].join("; "),
        },
      ],
    },
    // Immutable cache for content-hashed Next.js static chunks
    {
      source: "/_next/static/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    // Long cache for public assets (logos, icons, manifest) — manual versioning via filename
    {
      source: "/assets/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    {
      source: "/manifest.json",
      headers: [
        { key: "Cache-Control", value: "public, max-age=3600" },
      ],
    },
    {
      source: "/sw.js",
      headers: [
        // Service worker must not be cached aggressively — browser needs to check for updates
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
      ],
    },
  ],
}

export default nextConfig
