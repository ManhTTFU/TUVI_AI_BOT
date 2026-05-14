// Load root .env trước khi Next khởi tạo — tránh phải duplicate biến môi trường
// vào apps/web/.env.local. Next vẫn sẽ override bằng .env.local nếu có file đó.
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@tuvi/core',
    '@tuvi/lichvannien',
    '@tuvi/db',
    '@tuvi/ai',
    '@tuvi/astrology',
    '@tuvi/pdf',
    '@tuvi/tarot',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/metabismuth/tarot-json/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };
    return config;
  },
};

module.exports = nextConfig;
