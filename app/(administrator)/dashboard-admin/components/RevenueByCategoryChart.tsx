"use client";

import { useState } from 'react';
import { DollarSign, TrendingUp, Sparkles, BarChart as BarChartIcon } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell
} from 'recharts';
import { getCategoryRevenue } from '@/server/actions';
import RevenueByCategoryLoading from './RevenueByCategoryLoading';

// Neo-brutalist vibrant color palette
const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF8364'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
  }>;
  label?: string;
}

export function RevenueByCategoryChart() {
  const [activeBar, setActiveBar] = useState<number | null>(null);
  
  // Mengambil data revenue by category menggunakan React Query
  const { data: categoryRevenue = [], isLoading } = useQuery({
    queryKey: ['categoryRevenue'],
    queryFn: getCategoryRevenue,
    refetchInterval: 3000, // Refresh data setiap 3 detik
  });

  if (isLoading) {
    return <RevenueByCategoryLoading />;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(value);
  };

  // Format angka untuk YAxis agar menggunakan k dan M
  const formatAxisValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
          <div className="relative bg-white border-4 border-black p-4 transform -rotate-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-green-500" size={20} />
              <h3 className="font-black text-xl">{label}</h3>
            </div>
            <div className="font-mono bg-black text-white p-2 transform rotate-1">
              {formatCurrency(payload[0].value)}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

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
      <div className="absolute -inset-1 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />

      {/* Main Content */}
      <div className="relative transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="transform -rotate-2 bg-gradient-to-r from-green-400 to-blue-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2">
              <BarChartIcon size={24} />
              PENDAPATAN BERDASARKAN KATEGORI
            </h2>
          </div>
          <div className="bg-black text-white p-3 transform rotate-3 hover:rotate-6 transition-transform">
            <TrendingUp size={28} />
          </div>
        </div>

        {/* Subtitle */}
        <div className="mb-6 font-mono text-sm transform -rotate-1 inline-block bg-black text-white px-4 py-2">
        Perincian pendapatan berdasarkan kategori produk
        </div>

        {/* Chart */}
        <div className="h-[400px] relative border-4 border-black bg-white p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryRevenue}
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
                dataKey="category" 
                stroke="#000" 
                strokeWidth={2}
                tick={{ fill: '#000', fontWeight: 'bold' }}
              />
              <YAxis 
                stroke="#000" 
                strokeWidth={2}
                tick={{ fill: '#000', fontWeight: 'bold' }}
                tickFormatter={formatAxisValue}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="revenue" 
                radius={[4, 4, 0, 0]}
              >
                {categoryRevenue.map((entry, index) => (
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
        </div>

        {/* Legend */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {categoryRevenue.map((category, index) => (
            <div
              key={`legend-${index}`}
              className={`
                relative group/item border-3 border-black p-3
                transform transition-all duration-300
                ${activeBar === index ? 'bg-black text-white -translate-y-1' : 'bg-white hover:-translate-y-1'}
              `}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 border-2 border-black transform rotate-45 transition-transform group-hover/item:rotate-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="font-bold">{category.category}</span>
                <span className="ml-auto font-mono bg-white text-black px-2 py-1 border-2 border-black">
                  {formatCurrency(category.revenue)}
                </span>
              </div>
              <div className="absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10" />
            </div>
          ))}
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-2 -right-2 bg-green-400 border-2 border-black p-1 transform rotate-12">
          <DollarSign size={20} />
        </div>
        <div className="absolute -bottom-2 -left-2 bg-blue-400 border-2 border-black p-1 transform -rotate-12">
          <Sparkles size={20} />
        </div>
      </div>
    </div>
  );
}

export default RevenueByCategoryChart;