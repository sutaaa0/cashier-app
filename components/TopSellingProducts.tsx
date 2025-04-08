"use client";

import { useQuery } from '@tanstack/react-query';
import { formatRupiah } from "@/lib/formatIdr";
import { getTopSellingProducts } from "@/server/actions";
import { TrendingUp, Calendar } from "lucide-react";
import React, { useState } from "react";

interface Product {
  name: string;
  sold: number;
  revenue: number;
  growth: number;
}

const TopSellingProducts = () => {
  // State for date range selection
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default: 30 days ago
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  });
  
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  });

  // React Query with date range parameters
  const {
    data: topSellingProducts = [],
    isLoading,
    error,
    refetch
  } = useQuery<Product[]>({
    queryKey: ['topSellingProducts', startDate, endDate],
    queryFn: () => getTopSellingProducts(startDate, endDate),
    refetchInterval: 3000,
    placeholderData: (previousData) => previousData,
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  if (isLoading && topSellingProducts.length === 0) {
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
      
      {/* Date range selection form */}
      <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap items-center gap-2 border-2 border-black p-3 bg-gray-50">
        <div className="flex items-center">
          <Calendar size={16} className="mr-1" />
          <label htmlFor="startDate" className="font-bold mr-2">Dari:</label>
          <input 
            type="date" 
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border-2 border-black px-2 py-1"
          />
        </div> 
        
        <div className="flex items-center ml-2">
          <Calendar size={16} className="mr-1" />
          <label htmlFor="endDate" className="font-bold mr-2">Ke:</label>
          <input 
            type="date" 
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border-2 border-black px-2 py-1"
          />
        </div>
        
        <button 
          type="submit" 
          className="bg-black text-white font-bold px-4 py-1 ml-auto hover:bg-gray-800 transition-colors"
        >
          Terapkan Filter 
        </button>
      </form>
      
      <div className="space-y-4 overflow-y-auto h-[calc(100%-140px)]">
        {topSellingProducts.length > 0 ? (
          topSellingProducts.map((product) => (
            <div
              key={product.name}
              className="flex items-center justify-between p-3 border-2 border-black hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="font-bold">{product.name}</p>
                <p className="text-sm">Habis terjual: {product.sold} unit</p>
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
          ))
        ) : (
          <div className="text-center py-8">
            <p>Tidak ada produk yang ditemukan untuk rentang tanggal yang dipilih.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopSellingProducts;