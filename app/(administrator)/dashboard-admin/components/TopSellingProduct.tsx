"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Coffee, TrendingUp, Sparkles, Crown } from "lucide-react";
import { getTopProducts } from "@/server/actions";
import LoadingAnimationsTopSelling from "./LoadingAnimationsTopSelling";

interface Product {
  name: string;
  sales: number;
  growth: string;
}

const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#FF8364", "#45B7D1"];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        <div className="relative bg-white border-4 border-black p-4 transform -rotate-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-black text-xl">{label}</h3>
          </div>
          <div className="font-mono bg-black text-white p-2 transform rotate-1">{payload[0].value} PRODUK YANG TERJUAL</div>
        </div>
      </div>
    );
  }
  return null;
};

export function TopSellingProducts() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  // Use TanStack Query to fetch and cache data
  const { data: topProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['top-products'],
    queryFn: getTopProducts,
    refetchInterval: 3000, // Refresh data every 3 seconds
    staleTime: 2000,
  });

  if (isLoading) {
    return <LoadingAnimationsTopSelling />;
  }

  return (
    <div className="relative bg-white border-4 border-black p-6 transition-all duration-300 group">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute transform rotate-45 border-2 border-black"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: "20px",
              height: "20px",
            }}
          />
        ))}
      </div>

      {/* Glowing effect on hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />

      {/* Main content container */}
      <div className="relative transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="transform -rotate-2 bg-gradient-to-r from-yellow-300 to-yellow-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <Crown className="text-black" size={24} />
              <h2 className="text-2xl font-black tracking-tighter">PENJUALAN TERLARIS</h2>
            </div>
          </div>
          <div className="bg-black text-white p-3 transform rotate-3 hover:rotate-6 transition-transform">
            <Coffee size={28} />
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white border-4 border-black p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={topProducts}
              onMouseMove={(state) => {
                if (state?.activeTooltipIndex !== undefined) {
                  setActiveIndex(state.activeTooltipIndex);
                }
              }}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#000" strokeWidth={2} />
              <XAxis dataKey="name" stroke="#000" strokeWidth={2} tick={{ fill: "#000", fontSize: 14, fontWeight: "bold" }} />
              <YAxis stroke="#000" strokeWidth={2} tick={{ fill: "#000", fontSize: 14, fontWeight: "bold" }} />
              <Tooltip content={<CustomTooltip active={true} payload={topProducts.map((product) => ({ name: product.name, value: product.sales }))} label={activeIndex !== null ? topProducts[activeIndex].name : ""} />} />
              <Bar dataKey="sales" radius={[8, 8, 0, 0]}>
                {topProducts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className={`transition-all duration-300 ${activeIndex === index ? "opacity-100" : "opacity-80"}`} stroke="#000" strokeWidth={3} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Product List */}
        <div className="mt-6 grid grid-cols-1 gap-4">
          {topProducts.map((product, index) => (
            <div
              key={`product-${index}`}
              className={`
                relative group/item border-3 border-black p-3
                transform transition-all duration-300 hover:-translate-y-1
                ${activeIndex === index ? "bg-black text-white" : "bg-white"}
              `}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-3 border-black transform rotate-45 transition-transform group-hover/item:rotate-0" style={{ backgroundColor: COLORS[index] }} />
                <span className="font-bold text-lg">{product.name}</span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="font-mono bg-white text-black px-2 py-1 border-2 border-black">{product.sales} PRODUK</span>
                  <span className="flex items-center text-green-500 font-bold">
                    <TrendingUp size={16} className="mr-1" />
                    {product.growth}
                  </span>
                </div>
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

export default TopSellingProducts;