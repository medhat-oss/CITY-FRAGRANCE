import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    placement: "node",
    minify: true,
    buildCommand: "npx next build",
  },
  edgeExternals: [
    "@prisma/client",
    "@prisma/client/*",
    ".prisma/client",
    ".prisma/client/*",
  ],
};

export default config;
