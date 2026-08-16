import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages / any static host
  // Generates /out directory with fully static HTML+JS+CSS
  output: "export",
  // Disable image optimization (static export can't run the optimization server)
  images: {
    unoptimized: true,
  },
  // Trailing slash so all routes work as static files
  trailingSlash: true,
  // TypeScript errors don't block the build (matching existing config)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build (we have known setState-in-effect warnings)
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
