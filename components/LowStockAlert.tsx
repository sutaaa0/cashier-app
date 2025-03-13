"use client";

import { useQuery } from '@tanstack/react-query';
import { getLowStockProductsDashboard } from "@/server/actions";
import { AlertCircle, Package } from "lucide-react";
import React from "react";

// Definisikan tipe data
interface LowStockProduct {
  nama: string;
  stok: number;
  status: string;
}

const LowStockAlert = () => {
  const { data: lowStockProducts = [], isLoading } = useQuery<LowStockProduct[]>({
    queryKey: ['lowStockProducts'],
    queryFn: async () => {
      const data = await getLowStockProductsDashboard();
      if (Array.isArray(data)) {
        return data.map((product: LowStockProduct) => ({
          nama: product.nama,
          stok: product.stok,
          status: product.status === 'CRITICAL' || product.status === 'LOW' ? product.status : 'LOW'
        }));
      } else {
        console.error('Data yang diterima bukan array:', data);
        return [];
      }
    },
    refetchInterval: 3000, // Refresh setiap 3 detik
    placeholderData: (previousData) => previousData, // Pertahankan data sebelumnya selama loading
  });

  if (isLoading) {
    return (
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
        <p className="text-center">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Low Stock Warning</h2>
        <AlertCircle size={24} className="text-red-500" />
      </div>
      <div className="space-y-4 overflow-y-auto max-h-[400px]">
        {lowStockProducts.length === 0 ? (
          <div className="p-3 border-2 border-black bg-green-100">
            <p className="text-center">All stocks in normal condition</p>
          </div>
        ) : (
          lowStockProducts.map((product) => (
            <div
              key={product.nama}
              className={`flex items-center justify-between p-3 border-2 border-black hover:shadow-md transition-shadow ${
                product.status === 'CRITICAL' ? 'bg-red-100' : 'bg-yellow-100'
              }`}
            >
              <div>
                <p className="font-bold">{product.nama}</p>
                <p className="text-sm">Remaining {product.stok} items</p>
              </div>
              <div className="flex flex-col items-center">
                <Package 
                  size={20} 
                  className={product.status === 'CRITICAL' ? 'text-red-500' : 'text-yellow-600'} 
                />
                <span className={`text-xs font-bold mt-1 ${
                  product.status === 'CRITICAL' ? 'text-red-500' : 'text-yellow-600'
                }`}>
                  {product.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LowStockAlert;