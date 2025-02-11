"use client";

import Image from "next/image";
import { formatRupiah } from "@/lib/formatIdr";
import { Produk, Promotion } from "@prisma/client";

interface NeoProductCardProps {
  product: Produk & { image: string; kategori: { nama: string }; promotions?: Promotion[] };
  onClick: (product: Produk & { image: string; kategori: { nama: string }; promotions?: Promotion[] } & { harga: number }) => void;
}

export function NeoProductCard({ product, onClick }: NeoProductCardProps) {
  // Menghitung total diskon
  const totalDiscountPercentage = product.promotions?.reduce((acc, promo) => acc + (promo.discountPercentage || 0), 0) || 0;
  const totalDiscountAmount = product.promotions?.reduce((acc, promo) => acc + (promo.discountAmount || 0), 0) || 0;

  // Harga setelah diskon
  const discountedPrice = Math.max(
    product.harga * ((100 - totalDiscountPercentage) / 100) - totalDiscountAmount,
    0
  );

  return (
    <div 
    onClick={() => onClick({ ...product, harga: discountedPrice })} // Kirim harga diskon
      className="group cursor-pointer bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200
                 hover:-translate-y-0.5 active:shadow-none active:translate-y-0.5"
    >
      {/* Gambar Produk */}
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
        {/* Nama Produk */}
        <h3 className="font-bold text-lg font-mono">{product.nama}</h3>

        {/* Kategori & Harga */}
        <div className="flex items-center justify-between">
          <span className="px-2 py-1 bg-black text-white font-mono text-sm">{product.kategori.nama}</span>

          {/* Jika ada diskon, tampilkan harga yang dicoret */}
          {totalDiscountPercentage > 0 || totalDiscountAmount > 0 ? (
            <div className="text-right">
              <span className="line-through text-gray-500 font-mono text-sm">{formatRupiah(product.harga)}</span>
              <span className="block font-bold font-mono text-red-600 text-lg">{formatRupiah(discountedPrice)}</span>
            </div>
          ) : (
            <span className="font-bold font-mono text-sm">{formatRupiah(product.harga)}</span>
          )}
        </div>

        {/* Label Diskon */}
        {product.promotions && product.promotions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.promotions.map((promo) => (
              <span 
                key={promo.promotionId} 
                className="px-2 py-1 text-xs font-bold font-mono uppercase text-white"
                style={{
                  backgroundColor: promo.type === "FLASH_SALE" ? "#ff3b30" :
                                   promo.type === "SPECIAL_DAY" ? "#ff9500" :
                                   promo.type === "WEEKEND" ? "#4cd964" :
                                   promo.type === "PRODUCT_SPECIFIC" ? "#007aff" :
                                   "#8e8e93" // Default untuk lainnya
                }}
              >
                {promo.type.replace("_", " ")}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
