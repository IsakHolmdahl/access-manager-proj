import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',  // For Docker deployment
  
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8090',
  },
  
  // Strict mode for better development experience
  reactStrictMode: true,
  
  // Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
