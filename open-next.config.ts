import type { OpenNextConfig } from "@opennextjs/aws/types/open-next.js";

const config = {
  default: {
    minify: true,
  },
  cloudflare: {
    generateRoutesJson: false,
  },
} satisfies OpenNextConfig;

export default config;
