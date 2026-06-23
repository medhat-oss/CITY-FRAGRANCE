const config = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
    },
  },
  edgeExternals: [
    "@prisma/client",
    "@prisma/client/*",
    ".prisma/client",
    ".prisma/client/*",
    "@prisma/client-*"
  ],
};

module.exports = config;
