import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@notes/blocks", "@notes/core"],
};

export default nextConfig;
