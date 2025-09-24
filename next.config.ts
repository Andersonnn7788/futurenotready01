import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },  // lets build pass even with ESLint errors
};
export default nextConfig;
