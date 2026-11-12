import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    const api = process.env.API_INTERNAL_URL;
    if (!api) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${api.replace(/\/$/, "")}/api/v1/:path*`,
      },
    ];
  },
  experimental: {
    agentFeedback: true,
    instantInsights: {
      validationLevel: "manual-warning",
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
