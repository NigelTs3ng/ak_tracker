import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bandainamco-am.co.jp",
        pathname: "/am/vg/akplus/images/cardlist/**",
      },
    ],
  },
};

export default nextConfig;
