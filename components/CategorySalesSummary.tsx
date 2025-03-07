"use client";
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChartPie, Sparkles, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCategorySales } from "@/server/actions";

// Vibrant neo-brutalist color palette
const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#FF8364", "#45B7D1", "#96CEB4", "#D4A5A5"];

// Interfaces
interface CategorySale {
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
  }>;
}

export default function CategorySalesSummary() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  interface Position {
    left: string;
    top: string;
  }
  
  const [positions, setPositions] = useState<Position[]>([]);

  // Generate random positions on client-side only
  useEffect(() => {
    setPositions(
      [...Array(20)].map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }))
    );
  }, []);

  // Menggunakan React Query untuk fetching data
  const { 
    data: categoryData = [], 
    isLoading, 
    error 
  } = useQuery<CategorySale[]>({
    // Kunci query unik
    queryKey: ['categorySalesData'],
    
    // Fungsi untuk mengambil data kategori penjualan
    queryFn: getCategorySales,
    
    // Refresh data setiap 30 detik
    refetchInterval: 30000,
    
    // Pertahankan data sebelumnya selama loading
    placeholderData: (previousData) => previousData,
  });

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
          <div className="relative bg-white border-4 border-black p-4 transform -rotate-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-yellow-400" size={20} />
              <h3 className="font-black text-xl">{payload[0].name}</h3>
            </div>
            <div className="font-mono bg-black text-white p-2 transform rotate-1">{payload[0].value} ITEMS</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative bg-white border-4 border-black p-6 transition-all duration-300 group">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        {positions.map((pos, i) => (
          <div
            key={i}
            className="absolute transform rotate-45 border-2 border-black"
            style={{
              left: pos.left,
              top: pos.top,
              width: "20px",
              height: "20px",
            }}
          />
        ))}
      </div>

      {/* Glowing effect on hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />

      {/* Main content container */}
      <div className="relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="transform -rotate-2 bg-gradient-to-r from-yellow-300 to-yellow-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-black tracking-tighter">CATEGORY SALES</h2>
          </div>
          <div className="bg-black text-white p-3 transform rotate-3 hover:rotate-6 transition-transform">
            <ChartPie size={28} />
          </div>
        </div>

        {/* Chart Container */}
        <div className="h-[400px] relative">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-bounce bg-black text-white border-4 border-white p-4 transform -rotate-3">
                <p className="font-bold text-xl">LOADING DATA...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="bg-red-400 border-4 border-black p-4 transform rotate-2">
                <p className="font-bold text-xl">ERROR LOADING DATA!</p>
              </div>
            </div>
          ) : categoryData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="bg-red-400 border-4 border-black p-4 transform rotate-2">
                <p className="font-bold text-xl">NO DATA FOUND!</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  fill="#8884d8"
                  stroke="#000000"
                  strokeWidth={3}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      className={`transition-all duration-300 ${activeIndex === index ? "opacity-100 stroke-[4px]" : "opacity-80 stroke-[2px]"}`} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {categoryData.map((entry, index) => (
            <div
              key={`legend-${index}`}
              className={`
                relative group/item border-3 border-black p-3
                transform transition-all duration-300
                ${activeIndex === index ? "bg-black text-white -translate-y-1" : "bg-white hover:-translate-y-1"}
              `}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 border-3 border-black transform rotate-45 transition-transform group-hover/item:rotate-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                />
                <span className="font-bold text-lg">{entry.name}</span>
                <span className="ml-auto font-mono bg-white text-black px-2 py-1 border-2 border-black">{entry.value}</span>
              </div>
              <div className="absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10" />
            </div>
          ))}
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-2 -right-2 bg-yellow-300 border-2 border-black p-1 transform rotate-12">
          <TrendingUp size={20} />
        </div>
        <div className="absolute -bottom-2 -left-2 bg-pink-400 border-2 border-black p-1 transform -rotate-12">
          <Sparkles size={20} />
        </div>
      </div>
    </div>
  );
}