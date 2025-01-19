import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 images: {
    remotePatterns: [
      {
        hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com"
      }, {
        hostname: "i.pinimg.com"
      }
    ]
 }
};

export default nextConfig;