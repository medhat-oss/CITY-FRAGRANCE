/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Security / Network ────────────────────────────────────────────────────
  poweredByHeader: false,  // Remove X-Powered-By header in production
  compress: true,           // Gzip/Brotli compression for all responses

  // ─── Images ────────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    // Serve AVIF first (smallest), then WebP — significant bandwidth saving
    // for Cloudinary assets and reduces LCP paint time on slow connections
    formats: ['image/avif', 'image/webp'],
    // Cache optimized images for 24 hours on CDN/browser
    minimumCacheTTL: 86400,
    // Cloudflare Pages has no built-in image optimizer — Cloudinary delivers
    // auto-optimized assets (f_auto,q_auto) directly from its CDN.
    unoptimized: true,
  },

  // ─── Turbopack ─────────────────────────────────────────────────────────────
  turbopack: {},

  // ─── Turbopack Persistent FS Cache ─────────────────────────────────────────
  // This is the CRITICAL fix for the 13–16s dev cold-compilation spikes.
  // It persists the compiled module graph to .next/cache/turbopack between
  // dev sessions — subsequent `npm run dev` starts will be warm-cache fast
  // (typically <1s per route instead of 14s).
  experimental: {
    turbopackFileSystemCacheForDev: true,

    // ── Client-side route segment caching ────────────────────────────────────
    // By default, dynamic pages have staleTimes.dynamic = 0 (never cached in
    // client router). Setting it to 30s means navigating back to a recently
    // visited admin or collection page reuses the in-memory RSC payload instead
    // of re-fetching. Shared layouts (sidebar, header) are NEVER re-fetched
    // regardless of this value — only the changing page segment is affected.
    staleTimes: {
      dynamic: 0,    // Never cache dynamic pages — forces fresh server response on every nav
      static: 180,   // Cache static pages for 3 min
    },
  },

  // ─── Prevent Prisma from being bundled into the server action bundle ────────
  serverExternalPackages: ['@prisma/client'],

  // ─── HTTP Cache Headers ─────────────────────────────────────────────────────
  // Aggressive immutable caching for Next.js hashed static chunks.
  // Soft caching for public images and semi-static API responses.
  async headers() {
    return [
      // ── Dev: _next/static headers are SKIPPED — they break HMR/hydration ──
      // Prod: aggressive immutable cache for hashed JS/CSS chunks
      ...(process.env.NODE_ENV === 'development' ? [] : [{
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      }]),
      {
        // Public image assets in /public/images/
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // Products API — revalidate every 60s; serve stale for 5 min
        // while a fresh fetch runs in the background (no loading flash)
        source: '/api/products',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        // Collections metadata rarely changes
        source: '/api/collections',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=3600',
          },
        ],
      },
      {
        // Site settings — 30s hard cache matches our client-side settingsCache TTL
        source: '/api/admin/settings',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=30, stale-while-revalidate=120',
          },
        ],
      },
    ];
  },

  // ─── Webpack (dev only — Turbopack handles production) ─────────────────────
  webpack: (config, { dev }) => {
    if (dev) {
      // Use native OS file-system events (no polling) for faster HMR on Windows
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 200,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/prisma/migrations/**',
        ],
      };
    }
    return config;
  },

  // ─── Logging: only show full fetch URLs in development ─────────────────────
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV !== 'production',
    },
  },
};

export default nextConfig;
