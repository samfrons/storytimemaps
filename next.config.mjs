/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router doesn't use i18n config - we handle it client-side
  transpilePackages: ['mapbox-gl', 'react-map-gl'],

  // Next 16 removed the `eslint` option and `next build` no longer lints.
  // Linting now runs via the ESLint CLI (`pnpm lint`), not during the build.

  // Ignore TypeScript errors during production builds if needed
  typescript: {
    ignoreBuildErrors: false,
  },
  
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365,
    // Next 16 defaults images.qualities to [75] and coerces anything else to the
    // nearest allowed value. OptimizedImage defaults to 85, so without this the
    // historical photographs would silently drop to 75.
    qualities: [75, 85],
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
      // These cacheGroups previously used bare `test: /node_modules/` regexes. A regex test
      // matches EVERY module in node_modules, including extracted CSS, so stylesheet modules
      // were pulled into the JS cache groups. Webpack then emitted static/css/vendor.css under
      // the same chunk name and the runtime fetched it through the script loader, producing
      // "Uncaught SyntaxError: Invalid or unexpected token" on every page load - in production
      // as well as dev.
      //
      // Matching on the module object instead lets us keep the exact same JS chunking while
      // leaving CSS to Next's own stylesheet pipeline.
      const nodeModulesMatcher = (pattern) => (module) => {
        if (!module) return false;
        // Extracted stylesheets report a css/* module type; never claim those.
        if (typeof module.type === 'string' && module.type.startsWith('css')) return false;
        const identifier = module.resource || module.context || '';
        return pattern.test(identifier);
      };

      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          mapbox: {
            test: nodeModulesMatcher(/[\\/]node_modules[\\/](mapbox-gl|react-map-gl|@mapbox)[\\/]/),
            name: 'mapbox',
            priority: 30,
            reuseExistingChunk: true,
          },
          supercluster: {
            test: nodeModulesMatcher(/[\\/]node_modules[\\/](supercluster)[\\/]/),
            name: 'supercluster',
            priority: 25,
            reuseExistingChunk: true,
          },
          vendor: {
            test: nodeModulesMatcher(/[\\/]node_modules[\\/]/),
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
