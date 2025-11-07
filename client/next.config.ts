import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow images from external domains (movie poster URLs)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // Optimize image formats
    formats: ['image/avif', 'image/webp'],
    // Image sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable compression for better performance
  compress: true,
};

export default nextConfig;
