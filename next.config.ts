import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages and Capacitor Android
  output: "export",
  // Disable image optimization (both standalone server in container & static export work smoothly)
  images: {
    unoptimized: true,
  },
  // Trailing slash so all routes work as static files / relative paths
  trailingSlash: true,
  // TypeScript errors don't block the build
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
}

export default nextConfig;
