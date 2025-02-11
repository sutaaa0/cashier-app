"use client";

import { Produk, Promotion } from "@prisma/client";
import { NeoProductCard } from "./ProductCard";

interface ProductGridProps {
  products: (Produk & { image: string; kategori: { nama: string }; promotions?: Promotion[] })[];
  onProductSelect: (product: Produk & { image: string; kategori: { nama: string }; harga: number }) => void;
}

export function ProductGrid({ products, onProductSelect }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-8">
      {products.map((product) => {
        // Hitung total diskon
        const totalDiscountPercentage = product.promotions?.reduce((acc, promo) => acc + (promo.discountPercentage || 0), 0) || 0;
        const totalDiscountAmount = product.promotions?.reduce((acc, promo) => acc + (promo.discountAmount || 0), 0) || 0;

        // Hitung harga setelah diskon
        const discountedPrice = Math.max(
          product.harga * ((100 - totalDiscountPercentage) / 100) - totalDiscountAmount,
          0
        );

        return (
          <div key={product.produkId} className="transform odd:rotate-1 even:-rotate-1">
            <NeoProductCard 
              product={product} 
              onClick={() => onProductSelect({ ...product, harga: discountedPrice })} 
            />
          </div>
        );
      })}
    </div>
  );
}
