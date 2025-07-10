/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Production deployment configurations */
  
  // Enable image optimization for external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // IPFS gateways
      {
        protocol: 'https',
        hostname: '**.ipfs.w3s.link',
      },
      {
        protocol: 'https',
        hostname: 'gateway.ipfs.io',
      },
      {
        protocol: 'https',
        hostname: '**.ipfs.nftstorage.link',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
      },
      {
        protocol: 'https',
        hostname: 'dweb.link',
      },
      {
        protocol: 'https',
        hostname: '**.dweb.link',
      }
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // CORS headers for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },

  // Environment variable validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Transpile problematic packages
  transpilePackages: ['@web3modal/core', '@web3modal/ui', '@reown/appkit'],

  // Output configuration for deployment
  output: 'standalone',
  
  // Disable source maps in production for smaller bundle
  productionBrowserSourceMaps: false,

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      }
    }

    // Fix for HeartbeatWorker and other worker files
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader' },
    });

    // Handle worker files that might be causing issues
    config.module.rules.push({
      test: /HeartbeatWorker/,
      type: 'javascript/auto',
    });

    // Ensure ES modules are handled correctly
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };

    return config
  },
};

module.exports = nextConfig; 