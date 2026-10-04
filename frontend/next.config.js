const BACKEND_TARGET =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://127.0.0.1:8000';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_TARGET}/api/:path*`,
      },
      {
        source: '/static/:path*',
        destination: `${BACKEND_TARGET}/static/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
