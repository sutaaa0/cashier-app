import { useEffect, useState } from "react";
import { Package, AlertTriangle } from "lucide-react";
import { getStockItems } from "@/server/actions";

interface StockData {
  id: number;
  name: string;
  currentStock: number;
  minStock: number;
  category: string;
  lastUpdated: string;
  status: string;
}

export function InventoryManagement() {
  const [stockProducts, setStockProducts] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLowStockProducts() {
      try {
        const products = await getStockItems();
        setStockProducts(products?.data);
      } catch (err) {
        setError("Failed to load inventory data");
        console.error("Error loading inventory:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLowStockProducts();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
        <p className="text-center">Loading inventory data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
        <p className="text-center text-red-500">{error}</p>
      </div>
    );
  }



  return (
    <div className="relative bg-white border-4 h-[600px] overflow-y-scroll overflow-x-hidden  border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
      <h2 className="text-2xl font-bold mb-4">Manajemen Inventaris</h2>
      <div className="space-y-4">
        {stockProducts.map((product) => (
          <div key={product.id} className={`flex items-center justify-between p-3 border-2 border-black ${product.status === "CRITICAL" ? "bg-red-100" : product.status === "LOW" ? "bg-yellow-100" : "bg-green-100"}`}>
            <div className="flex items-center">
              <Package size={20} className="mr-2" />
              <div>
                <p className="font-bold">{product.name}</p>
                <p className="text-sm">Stok: {product.currentStock}</p>
              </div>
            </div>
            <div className="flex items-center">
              <AlertTriangle size={20} className="text-red-500 mr-2" />
              <span className="text-sm font-bold">Minimum: {product.minStock}</span>
            </div>
          </div>
        ))}
      </div>
      <button className="absolute  mt-4 w-full bg-black text-white font-bold py-2 px-4 border-2 border-black hover:bg-white hover:text-black transition-colors">Lihat Semua Produk</button>
    </div>
  );
}
