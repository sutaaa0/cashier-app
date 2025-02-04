"use client";

import Image from "next/image";
import { formatRupiah } from "@/lib/formatIdr";
import { Produk } from "@prisma/client";

interface NeoProductCardProps {
  product: Produk & { image: string; kategori: { nama: string } };
  onClick: () => void;
}

export function NeoProductCard({ product, onClick }: NeoProductCardProps) {
  console.log("produk nih :", product);
  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200
                 hover:-translate-y-0.5 active:shadow-none active:translate-y-0.5"
    >
      <div className="aspect-square relative mb-4 border-2 border-black overflow-hidden">
        <Image 
          src={product.image || "/placeholder.svg"} 
          alt={product.nama} 
          width={300} 
          height={300} 
          priority 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
        />
      </div>
      <div className="space-y-2">
        <h3 className="font-bold text-lg font-mono">{product.nama}</h3>
        <div className="flex items-center justify-between">
          <span className="px-2 py-1 bg-black text-white font-mono text-sm">{product.kategori.nama}</span>
          <span className="font-bold font-mono text-sm">{formatRupiah(product.harga)}</span>
        </div>
      </div>
    </div>
  );
}
