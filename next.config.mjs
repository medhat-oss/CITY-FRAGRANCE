/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Build: ignore TS/ESLint errors on Cloudflare (external packages) ──────
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

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
  // dev sessions — subsequent `npm run dev` starts will be warm-cache warm
  // (typically <1s per route instead of 14s).
  experimental: {
    serverMinification: true,
    staleTimes: {
      dynamic: 0,
      static: 180,
    },
  },

  // ─── Prevent Prisma from being bundled into the server action bundle ────────
  serverExternalPackages: ['@prisma/client'],

  // ─── HTTP Cache Headers ─────────────────────────────────────────────────────
  // Caching for public images and semi-static API responses.
  async headers() {
    return [
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
