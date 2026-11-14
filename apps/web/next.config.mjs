/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'https://brewlite.onrender.com';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: '/api/docs/:path*',
        destination: `${backendUrl}/api/docs/:path*`,
      },
    ];
  },
};

export default nextConfig;
