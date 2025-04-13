"use client"

import { Produk, Promotion } from "@prisma/client"
import { NeoProductCard } from "./ProductCard";

interface ProductGridProps {
  products: (Produk & {
    image: string;
    kategori: {
      nama: string;
      kategoriId: number
    };
    // Updated to match database schema
    promotionProducts?: {
      promotionId: number;
      promotion: Promotion;
    }[];
  })[];
  onProductSelect: (product: Produk & {
    image: string;
    kategori: { nama: string, kategoriId: number };
    harga: number;
  }) => void;
  isLoading: boolean;
}

export function ProductGrid({ products, onProductSelect, isLoading }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="transform odd:rotate-1 even:-rotate-1">
            <div className="bg-gray-100 border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="aspect-square relative mb-4 border-2 border-black bg-gray-200 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 w-3/4 animate-pulse"></div>
                <div className="flex items-center justify-between">
                  <div className="h-6 w-1/3 bg-gray-200 animate-pulse"></div>
                  <div className="h-6 w-1/4 bg-gray-200 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
          <p className="text-xl font-bold font-mono">Tidak ada produk yang ditemukan</p>
          <p className="font-mono">Silakan coba pencarian lain atau ubah kategori</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-8">
      {products.map((product) => (
        <div 
          key={product.produkId} 
          className="transform odd:rotate-1 even:-rotate-1 hover:z-10"
        >
          <NeoProductCard
            product={product}
            onClick={onProductSelect}
          />
        </div>
      ))}
    </div>
  );
}