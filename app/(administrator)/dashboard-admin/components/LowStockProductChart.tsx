"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package2, AlertTriangle, Sparkles, ArrowDown, ShoppingCart } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getLowStockProducts } from "@/server/actions";

// Neo-brutalist vibrant color palette
const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#FF8364", "#45B7D1"];

interface LowStockProduct {
  name: string;
  stock: number;
  minimumStock: number;
  status: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    payload?: any;
  }>;
  label?: string;
}

export function LowStockProductsChart() {
  const [activeBar, setActiveBar] = useState<number | null>(null);

  // Use TanStack Query to fetch and cache data
  const { data: lowStockProducts = [] } = useQuery<LowStockProduct[]>({
    queryKey: ["low-stock-products"],
    queryFn: getLowStockProducts,
    refetchInterval: 3000, // Refresh data every 3 seconds
    staleTime: 2000,
  });

  // Filter out products with zero stock for chart display
  const chartData = lowStockProducts.filter(product => product.stock > 0);
  
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
          <div className="relative bg-white border-4 border-black p-4 transform rotate-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="text-red-500" size={20} />
              <h3 className="font-black text-xl">{label}</h3>
            </div>
            <div className="font-mono bg-black text-white p-2 transform -rotate-1">
              {payload[0].value} UNITS LEFT
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative bg-white border-4 border-black p-6 transition-all duration-300 group h-[680px] overflow-hidden w-[850px] overflow-x-auto">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute transform -rotate-45 border-2 border-black"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: "20px",
              height: "20px",
            }}
          />
        ))}
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-red-400 via-orange-500 to-yellow-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />

      {/* Main Content */}
      <div className="relative transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="transform -rotate-2 bg-gradient-to-r from-red-400 to-orange-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2">
              <Package2 size={24} />
              LOW STOCK ALERT
            </h2>
          </div>
          <div className="bg-black text-white p-3 transform rotate-3 hover:rotate-6 transition-transform">
            <ArrowDown size={28} />
          </div>
        </div>

        {/* Chart */}
        <div className="h-[400px] relative border-4 border-black bg-white p-4">
        {lowStockProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            {/* Simple container with neo-brutalism style */}
            <div className="bg-white border-4 border-black p-6 transform rotate-1 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              {/* Simple checkmark icon */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-green-500 border-4 border-black flex items-center justify-center">
                  <span className="text-2xl font-black text-white">✓</span>
                </div>
              </div>
              
              {/* Simple neo-brutalist heading */}
              <h3 className="text-xl font-black text-center uppercase tracking-tight mb-3">
                Stok Aman
              </h3>
              
              {/* Simple message with neo-brutalist styling */}
              <div className="font-mono text-sm border-2 border-black p-2 text-center">
                Tidak ada produk dengan stok rendah
              </div>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-white border-4 border-black p-6 transform rotate-1 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-red-500 border-4 border-black flex items-center justify-center">
                  <ShoppingCart className="text-white" size={20} />
                </div>
              </div>
              
              <h3 className="text-xl font-black text-center uppercase tracking-tight mb-3">
                Stok Kosong
              </h3>
              
              <div className="font-mono text-sm border-2 border-black p-2 text-center bg-red-100">
                Semua produk memiliki stok 0
              </div>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              onMouseMove={(data) => {
                if (data.activeTooltipIndex !== undefined) {
                  setActiveBar(data.activeTooltipIndex);
                }
              }}
              onMouseLeave={() => setActiveBar(null)}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#000"
                strokeWidth={1}
                opacity={0.1}
              />
              <XAxis 
                dataKey="name" 
                stroke="#000" 
                strokeWidth={2}
                tick={{ fill: '#000', fontWeight: 'bold' }}
              />
              <YAxis 
                stroke="#000" 
                strokeWidth={2}
                tick={{ fill: '#000', fontWeight: 'bold' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="stock" 
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((product, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    className={`transition-all duration-300 ${
                      activeBar === index ? 'opacity-100' : 'opacity-80'
                    }`}
                    stroke="#000"
                    strokeWidth={2}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        </div>

        {/* Legend */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {lowStockProducts.map((product, index) => {
            const isZeroStock = product.stock === 0;
            const chartIndex = chartData.findIndex(p => p.name === product.name);
            
            return (
              <div
                key={`legend-${index}`}
                className={`
                  relative group/item border-3 border-black p-3
                  transform transition-all duration-300
                  ${isZeroStock 
                    ? "bg-red-100" 
                    : chartIndex === activeBar 
                      ? "bg-black text-white -translate-y-1" 
                      : "bg-white hover:-translate-y-1"
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-6 h-6 border-2 border-black transform rotate-45 transition-transform group-hover/item:rotate-0`} 
                    style={{ 
                      backgroundColor: isZeroStock 
                        ? "#FF0000" 
                        : COLORS[chartIndex % COLORS.length] 
                    }} 
                  />
                  <span className={`font-bold ${isZeroStock ? "text-red-600" : ""}`}>
                    {product.name}
                  </span>
                  <span className={`ml-auto font-mono px-2 py-1 border-2 border-black ${
                    isZeroStock ? "bg-red-600 text-white" : "bg-white text-black"
                  }`}>
                    {product.stock}
                  </span>
                </div>
                <div className="absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10" />
              </div>
            );
          })}
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-2 -right-2 bg-red-400 border-2 border-black p-1 transform rotate-12">
          <AlertTriangle size={20} />
        </div>
        <div className="absolute -bottom-2 -left-2 bg-yellow-300 border-2 border-black p-1 transform -rotate-12">
          <Sparkles size={20} />
        </div>
      </div>
    </div>
  );
}

export default LowStockProductsChart;