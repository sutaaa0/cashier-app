"use client";

import { Produk, Promotion } from "@prisma/client";
import { NeoProductCard } from "./ProductCard";
import { isAfter, isBefore } from "date-fns";

interface ProductGridProps {
  products: (Produk & { image: string; kategori: { nama: string }; promotions?: Promotion[] })[];
  onProductSelect: (product: Produk & { image: string; kategori: { nama: string }; harga: number }) => void;
}


export function ProductGrid({ products, onProductSelect }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-8">
      {products.map((product) => {
        // Fungsi untuk memeriksa apakah promosi aktif
        const isPromotionActive = (promo: Promotion): boolean => {
          const today = new Date();
          const startDate = new Date(promo.startDate);
          const endDate = new Date(promo.endDate);
          return isAfter(today, startDate) && isBefore(today, endDate);
        };

        // Filter promosi yang aktif
        const activePromotions = product.promotions?.filter(isPromotionActive) || [];

        // Hitung total diskon hanya dari promosi yang aktif
        const totalDiscountPercentage = activePromotions.reduce(
          (acc, promo) => acc + (promo.discountPercentage || 0),
          0
        );
        const totalDiscountAmount = activePromotions.reduce(
          (acc, promo) => acc + (promo.discountAmount || 0),
          0
        );

        // Hitung harga setelah diskon
        const discountedPrice = Math.max(
          product.harga * ((100 - totalDiscountPercentage) / 100) - totalDiscountAmount,
          0
        );

        // Jika tidak ada promosi aktif, gunakan harga awal
        const finalPrice = activePromotions.length > 0 ? discountedPrice : product.harga;

        return (
          <div key={product.produkId} className="transform odd:rotate-1 even:-rotate-1">
            <NeoProductCard
              product={product}
              onClick={() => onProductSelect({ ...product, harga: finalPrice })}
            />
          </div>
        );
      })}
    </div>
  );
}