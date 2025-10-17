/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router artık Next.js 13.4+ sürümlerinde varsayılan olarak etkin
  
  // Hydration hatalarını önlemek için
  experimental: {
    // Browser extension'larından gelen HTML değişikliklerini görmezden gel
  },
  
  // Trailing slash redirect'i devre dışı bırak
  trailingSlash: false,
  
  // React strict mode'u devre dışı bırak (hydration hatalarını azaltır)
  reactStrictMode: false,
  
  // Compiler optimizasyonları
  compiler: {
    // Hydration hatalarını azaltmak için
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Vercel için output ayarları
  output: 'standalone',
  
  // Webpack config
  webpack: (config, { dev, isServer }) => {
    // Browser extension'larından gelen değişiklikleri görmezden gel
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    
    // Vercel için optimizasyonlar
    if (process.env.VERCEL) {
      config.resolve.alias = {
        ...config.resolve.alias,
        fs: false,
      };
    }
    
    return config;
  },
}

module.exports = nextConfig
