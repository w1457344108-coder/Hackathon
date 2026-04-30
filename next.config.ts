import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    useLightningcss: false,
    webpackBuildWorker: false
  }
};

export default nextConfig;
