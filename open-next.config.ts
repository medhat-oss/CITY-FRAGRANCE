import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
    },
  },
  // Put prisma edge client exclusions here inside edgeExternals as required by the schema validation
  edgeExternals: [
    "@prisma/client",
    "@prisma/client/*",
    ".prisma/client",
    ".prisma/client/*",
    "@prisma/client-*"
  ],
};

export default config;
