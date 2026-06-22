import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: '/dga',
  assetPrefix: '/dga',
  images: { unoptimized: true },
};

export default nextConfig;
