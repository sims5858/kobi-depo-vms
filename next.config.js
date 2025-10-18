/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  trailingSlash: false,
  reactStrictMode: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  output: 'standalone',
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
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
