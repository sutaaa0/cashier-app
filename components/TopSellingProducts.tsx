"use client";

import { useQuery } from '@tanstack/react-query';
import { formatRupiah } from "@/lib/formatIdr";
import { getTopSellingProducts } from "@/server/actions";
import { TrendingUp } from "lucide-react";
import React from "react";

interface Product {
  name: string;
  sold: number;
  revenue: number;
  growth: number;
}

const TopSellingProducts = () => {
  const { 
    data: topSellingProducts = [], 
    isLoading, 
    error 
  } = useQuery<Product[]>({
    queryKey: ['topSellingProducts'],
    queryFn: getTopSellingProducts,
    // Refresh data every 3 seconds
    refetchInterval: 3000,
    // Keep previous data during loading to prevent UI flicker
    placeholderData: (previousData) => previousData,
  });

  if (isLoading) {
    return (
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
        <p>Memuat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
        <p className="text-red-500">Gagal mengambil data produk terlaris</p>
      </div>
    );
  }

  return (
    <div className="h-[650px] bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Produk Terlaris</h2>
        <TrendingUp size={24} className="text-green-500" />
      </div>
      <div className="space-y-4 overflow-y-auto max-h-[400px]">
        {topSellingProducts.map((product) => (
          <div 
            key={product.name} 
            className="flex items-center justify-between p-3 border-2 border-black hover:bg-gray-50 transition-colors"
          >
            <div>
              <p className="font-bold">{product.name}</p>
              <p className="text-sm">Terjual: {product.sold} unit</p>
              <p className="text-sm">{formatRupiah(product.revenue)}</p>
            </div>
            <div
              className={`px-2 py-1 font-bold border-2 border-black transform rotate-1
              ${product.growth >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
            >
              {product.growth >= 0 ? "+" : ""}
              {product.growth}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopSellingProducts;