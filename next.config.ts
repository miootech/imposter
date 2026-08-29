import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Capacitor Android app / Cloudflare Pages
  // Generates /out directory with fully static HTML+JS+CSS
  output: "export",
  // Disable image optimization (static export can't run the optimization server)
  images: {
    unoptimized: true,
  },
  // Trailing slash so all routes work as static files
  trailingSlash: true,
  // TypeScript errors don't block the build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  // IMPORTANT for Capacitor: don't set a basePath — the WebView loads files
  // from `file:///android_asset/` and absolute paths break. We use relative
  // paths throughout the app, and trailingSlash ensures all chunk URLs work.
}

export default nextConfig;
