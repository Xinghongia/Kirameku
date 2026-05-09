import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://127.0.0.1:8000/uploads/:path*",
      },
    ];
  },

  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
    ],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "static.hiromu.top" },
      { protocol: "https", hostname: "hiromu520.oss-cn-beijing.aliyuncs.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
