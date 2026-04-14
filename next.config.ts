import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".next-local",
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
