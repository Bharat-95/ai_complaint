import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 eslint: {
    ignoreDuringBuilds: true, // ⬅️ disables ESLint in build
  },
  typescript: {
    ignoreBuildErrors: true,  // ⬅️ (optional) lets TS errors pass build
  },
};

export default nextConfig;
