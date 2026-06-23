import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    placement: "server",
    minify: true,
    build: {
      external: ["@prisma/client-*", "@prisma/client/edge"],
    },
  },
};

export default config;
