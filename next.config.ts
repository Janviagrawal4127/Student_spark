import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Treat pdf-parse as a server-only external (CommonJS) package
  // so Turbopack/Webpack don't try to bundle it as ESM
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
