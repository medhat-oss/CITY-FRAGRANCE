/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },

  // ─── Webpack: faster incremental builds on Windows ────────────────────────
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Reduce filesystem polling overhead — use native OS file events instead
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

  // ─── Reduce the set of files Next.js traces for output bundling ──────────
  // Prevents it from crawling all of node_modules on every cold start.
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/**',
      'node_modules/webpack/**',
      'node_modules/terser/**',
      'node_modules/next/dist/compiled/**',
    ],
  },

  // ─── Logging: show full revalidation + fetch cache activity in dev ────────
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
