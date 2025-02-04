"use client";

import { Produk } from "@prisma/client";
import { NeoProductCard } from "./ProductCard";

interface ProductGridProps {
  products: (Produk & { image: string; kategori: { nama: string } })[];
  onProductSelect: (product: Produk & { image: string; kategori: { nama: string } }) => void;
}

export function ProductGrid({ products, onProductSelect }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-8">
      {products.map((product) => (
        <div key={product.produkId} className="transform odd:rotate-1 even:-rotate-1">
          <NeoProductCard 
            product={product} 
            onClick={() => onProductSelect(product)}
          />
        </div>
      ))}
    </div>
  );
}
