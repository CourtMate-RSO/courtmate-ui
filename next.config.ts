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
      // NOTE: Booking proxy rewrite removed - the API route at /api/proxy/booking/reservation/route.ts
      // handles booking requests and adds the required Authorization header for authentication
    ];
  },
};

export default nextConfig;
