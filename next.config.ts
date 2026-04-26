import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    useLightningcss: false,
    webpackBuildWorker: false
  }
};

export default nextConfig;
