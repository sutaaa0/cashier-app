import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 images: {
    remotePatterns: [
      {
        protocol: "https", // Pastikan menggunakan https
        hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com", // Hostname pertama
        pathname: "/**", // Pathway untuk semua gambar
      },
      {
        protocol: "https", // Pastikan menggunakan https
        hostname: "i.pinimg.com", // Hostname kedua
        pathname: "/**", // Pathway untuk semua gambar
      },
      {
        protocol: "https", // Pastikan menggunakan https
        hostname: "res.cloudinary.com", // Hostname Cloudinary
        pathname: "/**", // Pathway untuk semua gambar
      },
    ]
 }
};

export default nextConfig;