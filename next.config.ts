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
