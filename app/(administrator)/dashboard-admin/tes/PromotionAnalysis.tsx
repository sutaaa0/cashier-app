"use client";

import { useQuery } from '@tanstack/react-query';
import { Percent, DollarSign, TrendingUp, Sparkles } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { formatRupiah } from "@/lib/formatIdr";
import { getPromotionAnalytics } from "@/server/actions";
import { useState } from 'react';

// Neo-brutalist vibrant color palette matching RevenueByCategoryChart
const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF8364'];

interface PromotionAnalytics {
  name: string;
  revenue: number;
  transactions: number;
  profit: number; 
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey: string;
  }>;
  label?: string;
}

export function PromotionAnalysis() {
  const { data: promotionData = [], isLoading } = useQuery<PromotionAnalytics[]>({
    queryKey: ['promotionAnalytics'],
    queryFn: getPromotionAnalytics,
    refetchInterval: 3000, // Refresh data every 30 seconds
    placeholderData: (previousData) => previousData, // Keep previous data during loading
  });

  
  
  const [activeBar, setActiveBar] = useState<number | null>(null);

  const totalRevenue = promotionData.reduce((sum, promo) => sum + promo.revenue, 0);
  const totalProfit = promotionData.reduce((sum, promo) => sum + promo.profit, 0);
  const bestPromotion = promotionData.length > 0 
    ? promotionData.reduce((best, current) => current.profit > best.profit ? current : best)
    : null;

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      // Ekstrak semua nilai dari payload untuk menampilkan semua data
      const revenueItem = payload.find(item => item.dataKey === "revenue");
      const profitItem = payload.find(item => item.dataKey === "profit");
      const transactionsItem = payload.find(item => item.dataKey === "transactions");
      
      // Dapatkan nilai untuk setiap kategori
      const revenue = revenueItem?.value as number || 0;
      const profit = profitItem?.value as number || 0;
      const transactions = transactionsItem?.value as number || 0;
      
      return (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
          <div className="relative bg-white border-4 border-black p-4 transform -rotate-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-purple-500" size={20} />
              <h3 className="font-black text-xl">{label}</h3>
            </div>
            
            <div className="space-y-2">
              <div className="font-mono bg-black text-white p-2 transform rotate-1">
                {formatRupiah(revenue)}
                <span className="ml-2 font-bold" style={{ color: COLORS[0] }}>Revenue</span>
              </div>
              
              <div className="font-mono bg-black text-white p-2 transform rotate-1">
                {formatRupiah(profit)}
                <span className="ml-2 font-bold" style={{ color: COLORS[1] }}>Profit</span>
              </div>
              
              <div className="font-mono bg-black text-white p-2 transform rotate-1">
                {transactions}
                <span className="ml-2 font-bold" style={{ color: COLORS[2] }}>Transactions</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-pulse h-[600px]">
        <div className="h-8 bg-gray-200 w-1/3 mb-6"></div>
        <div className="h-[400px] bg-gray-100 border-4 border-black"></div>
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="h-20 bg-gray-200 border-2 border-black"></div>
          <div className="h-20 bg-gray-200 border-2 border-black"></div>
          <div className="h-20 bg-gray-200 border-2 border-black"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white border-4 border-black p-6 transition-all duration-300 group md:col-span-2">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute transform rotate-45 border-2 border-black"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: '20px',
              height: '20px'
            }}
          />
        ))}
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 via-blue-500 to-indigo-600 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />

      {/* Main Content */}
      <div className="relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="transform -rotate-2 bg-gradient-to-r from-purple-400 to-blue-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2">
              <Percent size={24} />
              PROMOTION ANALYSIS 
            </h2>
          </div>
          <div className="bg-black text-white p-3 transform rotate-3 hover:rotate-6 transition-transform">
            <TrendingUp size={28} />
          </div>
        </div>

        {/* Subtitle */}
        <div className="mb-6 font-mono text-sm transform -rotate-1 inline-block bg-black text-white px-4 py-2">
        Promotion performance based on revenue & transactions 
        </div>

        {/* Chart */}
        <div className="h-[400px] relative border-4 border-black bg-white p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={promotionData}
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
                yAxisId="left" 
                orientation="left" 
                stroke="#000" 
                strokeWidth={2}
                tick={{ fill: '#000', fontWeight: 'bold' }}
                tickFormatter={(value) => `${value / 1000}K`}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#000" 
                strokeWidth={2}
                tick={{ fill: '#000', fontWeight: 'bold' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                yAxisId="left" 
                dataKey="revenue" 
                name="Revenue" 
                radius={[4, 4, 0, 0]}
              >
                {promotionData.map((entry, index) => (
                  <Cell
                    key={`revenue-${index}`}
                    fill={COLORS[0]}
                    className={`transition-all duration-300 ${
                      activeBar === index ? 'opacity-100' : 'opacity-80'
                    }`}
                    stroke="#000"
                    strokeWidth={2}
                  />
                ))}
              </Bar>
              <Bar 
                yAxisId="left" 
                dataKey="profit" 
                name="Profit" 
                radius={[4, 4, 0, 0]}
              >
                {promotionData.map((entry, index) => (
                  <Cell
                    key={`profit-${index}`}
                    fill={COLORS[1]}
                    className={`transition-all duration-300 ${
                      activeBar === index ? 'opacity-100' : 'opacity-80'
                    }`}
                    stroke="#000"
                    strokeWidth={2}
                  />
                ))}
              </Bar>
              <Bar 
                yAxisId="right" 
                dataKey="transactions" 
                name="Transactions" 
                radius={[4, 4, 0, 0]}
              >
                {promotionData.map((entry, index) => (
                  <Cell
                    key={`transactions-${index}`}
                    fill={COLORS[2]}
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
        </div>

        {/* Stats cards */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="relative group/item border-3 border-black p-3 bg-white hover:-translate-y-1 transition-all duration-300">
            <div className="flex flex-col">
              <span className="font-bold">Best Promotion</span>
              <span className="font-mono bg-purple-100 text-black px-2 py-1 border-2 border-black mt-2">
                {bestPromotion?.name || '-'}
              </span>
            </div>
            <div className="absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10" />
          </div>
          
          <div className="relative group/item border-3 border-black p-3 bg-white hover:-translate-y-1 transition-all duration-300">
            <div className="flex flex-col">
              <span className="font-bold">Total Revenue</span>
              <span className="font-mono bg-green-100 text-black px-2 py-1 border-2 border-black mt-2">
                {formatRupiah(totalRevenue)}
              </span>
            </div>
            <div className="absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10" />
          </div>
          
          <div className="relative group/item border-3 border-black p-3 bg-white hover:-translate-y-1 transition-all duration-300">
            <div className="flex flex-col">
              <span className="font-bold">Total Profit</span>
              <span className="font-mono bg-blue-100 text-black px-2 py-1 border-2 border-black mt-2">
                {formatRupiah(totalProfit)}
              </span>
            </div>
            <div className="absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10" />
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[
            { name: "Revenue", color: COLORS[0] },
            { name: "Profit", color: COLORS[1] },
            { name: "Transactions", color: COLORS[2] }
          ].map((item, index) => (
            <div
              key={`legend-${index}`}
              className="relative group/item border-3 border-black p-3 bg-white hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 border-2 border-black transform rotate-45 transition-transform group-hover/item:rotate-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-bold">{item.name}</span>
              </div>
              <div className="absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10" />
            </div>
          ))}
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-2 -right-2 bg-purple-400 border-2 border-black p-1 transform rotate-12">
          <Percent size={20} />
        </div>
        <div className="absolute -bottom-2 -left-2 bg-blue-400 border-2 border-black p-1 transform -rotate-12">
          <Sparkles size={20} />
        </div>
      </div>
    </div>
  );
}