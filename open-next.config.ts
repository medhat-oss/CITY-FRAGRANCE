import { defineConfig } from "@opennextjs/cloudflare";

export default defineConfig({
  default: {
    minify: true,
    build: {
      external: ["@prisma/client", "@prisma/client/*"],
    },
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  edgeExternals: ["node:crypto"],
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  cloudflare: {
    generateRoutesJson: false,
  },
});
