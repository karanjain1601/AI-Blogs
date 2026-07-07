import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source; Next must transpile them.
  transpilePackages: ["@notes/blocks", "@notes/core", "@notes/renderer-web"],
  images: {
    // Add Supabase Storage + allowed media hosts here in Phase 1.
    remotePatterns: [],
  },
};

export default nextConfig;
