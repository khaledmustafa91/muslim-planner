/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Turbopack configuration (Next.js 16+)
  turbopack: {},

  // Vercel-specific optimizations
  experimental: {
    optimizeCss: true, // Enable CSS optimization
  },
};

export default nextConfig;
