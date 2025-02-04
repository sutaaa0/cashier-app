import { formatRupiah } from "@/lib/formatIdr";
import { getTopSellingProducts } from "@/server/actions";
import { TrendingUp } from "lucide-react";
import React, { useEffect, useState } from "react";

interface Product {
  name: string;
  sold: number;
  revenue: number;
  growth: number;
}

const TopSellingProducts = () => {
  const [topSellingProducts, setTopSellingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getTopSellingProducts();
        setTopSellingProducts(data);
        setError(null);
      } catch (error) {
        console.error("Error mengambil data produk terlaris:", error);
        setError("Gagal mengambil data produk terlaris");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
        <p>Memuat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-[500px] bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Produk Terlaris</h2>
        <TrendingUp size={24} className="text-green-500" />
      </div>
      <div className="space-y-4">
        {topSellingProducts.map((product) => (
          <div key={product.name} className="flex items-center justify-between p-3 border-2 border-black">
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