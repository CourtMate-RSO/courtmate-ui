import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: '/api/proxy/user/:path*',
        destination: `${process.env.USER_SERVICE_URL || 'http://user-service'}/:path*`,
      },
      {
        source: '/api/proxy/court/:path*',
        destination: `${process.env.COURT_SERVICE_URL || 'http://court-service'}/:path*`,
      },
      {
        source: '/api/proxy/booking/:path*',
        destination: `${process.env.BOOKING_SERVICE_URL || 'http://booking-service'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
