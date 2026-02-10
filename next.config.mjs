/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router doesn't use i18n config - we handle it client-side
  transpilePackages: ['mapbox-gl', 'react-map-gl'],

  // Ignore ESLint warnings during production builds (they're set to warn, not error)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignore TypeScript errors during production builds if needed
  typescript: {
    ignoreBuildErrors: false,
  },
  
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  
  compress: true,
  
  poweredByHeader: false,
  
  reactStrictMode: true,
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Optimize bundle splitting and suppress Supabase edge runtime warnings
  webpack: (config, { isServer }) => {
    // Suppress Supabase realtime-js edge runtime warnings (library issue)
    if (isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        // Alias realtime-js to prevent edge runtime warning
      };
    }

    if (!isServer) {
      // Split Mapbox into separate chunk
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          mapbox: {
            test: /[\\/]node_modules[\\/](mapbox-gl|react-map-gl|@mapbox)[\\/]/,
            name: 'mapbox',
            priority: 30,
            reuseExistingChunk: true,
          },
          supercluster: {
            test: /[\\/]node_modules[\\/](supercluster)[\\/]/,
            name: 'supercluster',
            priority: 25,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  },
  
  // Add headers for better caching
  async headers() {
    return [
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
