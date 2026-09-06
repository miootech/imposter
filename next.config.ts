import type { NextConfig } from "next";

const isCapacitor = process.env.CAPACITOR_BUILD === "true";

const nextConfig: NextConfig = {
  // Standalone for web/sandbox deployment, export for Capacitor Android
  output: isCapacitor ? "export" : "standalone",
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
