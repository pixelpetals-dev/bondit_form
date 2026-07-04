import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully client-side app → export static HTML/CSS/JS to `out/` for the VPS.
  // Swap this to a Node deployment later when the backend (PDF/email/admin) lands.
  output: "export",
  // Each route becomes a folder with index.html — simplest to serve from nginx.
  trailingSlash: true,
  // No image optimization server in a static export.
  images: { unoptimized: true },
};

export default nextConfig;
