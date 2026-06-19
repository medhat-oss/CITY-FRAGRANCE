import { defineConfig } from "@opennextjs/cloudflare";

export default defineConfig({
  default: {
    minify: true,
  },
  cloudflare: {
    generateRoutesJson: false,
  },
});
