import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@notes/blocks", "@notes/core"],
  // argon2 uses NAPI-RS native binaries — must not be bundled
  serverExternalPackages: ["@node-rs/argon2"],
};

export default nextConfig;
