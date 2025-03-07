import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, AlertTriangle } from "lucide-react";
import { getStockItems } from "@/server/actions";

interface StockData {
  id: number;
  name: string;
  currentStock: number;
  minStock: number;
  category: string;
  lastUpdated: string;
  status: "CRITICAL" | "LOW" | "NORMAL";
}

export function InventoryManagement() {
  // State untuk tracking aktif/tidaknya produk
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);

  // Menggunakan React Query untuk fetching data
  const { 
    data: stockProducts = [], 
    isLoading, 
    error 
  } = useQuery<StockData[]>({
    // Kunci query unik
    queryKey: ['inventoryStockItems'],
    
    // Fungsi untuk mengambil data stok
    queryFn: async () => {
      const result = await getStockItems();
      return (result?.data ?? []).map(item => ({
        ...item,
        status: item.status || "NORMAL"
      }));
    },
    
    // Refresh data setiap 3 detik
    refetchInterval: 3000,
    
    // Pertahankan data sebelumnya selama loading
    placeholderData: (previousData) => previousData,
  });

  // Tampilan loading
  if (isLoading) {
    return (
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
        <p className="text-center">Loading inventory data...</p>
      </div>
    );
  }

  // Tampilan error
  if (error) {
    return (
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
        <p className="text-center text-red-500">Failed to load inventory data</p>
      </div>
    );
  }

  return (
    <div className="relative bg-white border-4 h-[600px] overflow-y-scroll overflow-x-hidden border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
      <h2 className="text-2xl font-bold mb-4">Manajemen Inventaris</h2>
      <div className="space-y-4">
        {stockProducts.map((product) => (
          <div 
            key={product.id} 
            className={`
              flex items-center justify-between p-3 border-2 border-black 
              ${product.status === "CRITICAL" ? "bg-red-100" : 
                product.status === "LOW" ? "bg-yellow-100" : "bg-green-100"}
              cursor-pointer hover:opacity-80 transition-all
            `}
            onClick={() => setExpandedProductId(
              expandedProductId === product.id ? null : product.id
            )}
          >
            <div className="flex items-center">
              <Package size={20} className="mr-2" />
              <div>
                <p className="font-bold">{product.name}</p>
                <p className="text-sm">Stok: {product.currentStock}</p>
                {expandedProductId === product.id && (
                  <div className="mt-2 text-sm">
                    <p>Kategori: {product.category}</p>
                    <p>Terakhir Diperbarui: {product.lastUpdated}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <AlertTriangle 
                size={20} 
                className={`mr-2 ${
                  product.status === "CRITICAL" ? "text-red-500" : 
                  product.status === "LOW" ? "text-yellow-500" : "text-green-500"
                }`} 
              />
              <span className="text-sm font-bold">Minimum: {product.minStock}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}