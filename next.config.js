/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // AppKit requires these externals for proper browser functionality
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig 