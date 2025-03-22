"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Users, Crown, BarChart2, Zap } from 'lucide-react';
import { getCustomerTransactionsAnalytic } from '@/server/actions';
import CustomerTransactionsLoading from './CustomerTransactionsLoading';

interface CustomerTransaction {
  name: string;
  value: number;
  transactions: number;
  growth: string;
  growthColor?: string;
}

const COLORS = ['#FF6B6B', '#4ECDC4']; // Keeping original colors

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        <div className="relative bg-white border-4 border-black p-4 transform rotate-1 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-2">
            {label === 'Regular' ? <Users className="text-[#FF6B6B]" size={20} /> : <Crown className="text-[#4ECDC4]" size={20} />}
            <h3 className="font-black text-xl">{label} Customers</h3>
          </div>
          <div className="font-mono bg-black text-white p-2 transform -rotate-1">{payload[0].value} TRANSACTIONS</div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomerTransactionsChart = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  // Fetch data using TanStack Query
  const { data, isLoading } = useQuery<CustomerTransaction[]>({
    queryKey: ['customer-transactions'],
    queryFn: async () => {
      const res = await getCustomerTransactionsAnalytic();
      // Process the data and add the growthColor property
      return res.map(item => ({
        ...item,
        growthColor: parseFloat(item.growth) >= 0 ? 'text-green-500' : 'text-red-500'
      }));
    },
    refetchInterval: 3000, // Refresh data every 3 seconds
    staleTime: 2000,
  });
  
  // Set default empty array if data is not available yet
  const customerData: CustomerTransaction[] = data || [];
  
  // Calculate total transactions
  const totalTransactions = customerData.reduce((sum, item) => sum + item.transactions, 0);

  if (isLoading) return <CustomerTransactionsLoading />;

  return (
    <div className="relative bg-white border-4 border-black p-6 transition-all duration-300 group h-[680px]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute transform rotate-12 border border-black"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: "30px",
              height: "30px",
              borderRadius: "50%"
            }}
          />
        ))}
      </div>

      {/* Glowing effect on hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />

      {/* Main content container */}
      <div className="relative transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="transform -rotate-2 bg-gradient-to-r from-blue-300 to-purple-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2">
              <Users className="text-black" size={24} />
              <h2 className="text-2xl font-black tracking-tighter">CUSTOMER ANALYTICS</h2>
            </div>
          </div>
          <div className="bg-black text-white p-3 transform rotate-3 hover:rotate-6 transition-transform">
            <BarChart2 size={28} />
          </div>
        </div>

        {/* Total Transactions Indicator */}
        <div className="flex items-center justify-center mb-6 bg-white border-4 border-black p-4 transform -rotate-1">
          <div className="text-3xl font-black mr-4">{totalTransactions.toLocaleString()}</div>
          <div className="text-lg font-bold">TOTAL TRANSACTIONS</div>
        </div>

        {/* Chart */}
        <div className="bg-white border-4 border-black p-6">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={customerData}
              onMouseMove={(state) => {
                if (state?.activeTooltipIndex !== undefined) {
                  setActiveIndex(state.activeTooltipIndex);
                }
              }}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#000" strokeWidth={1} />
              <XAxis dataKey="name" stroke="#000" strokeWidth={2} tick={{ fill: "#000", fontSize: 14, fontWeight: "bold" }} />
              <YAxis stroke="#000" strokeWidth={2} tick={{ fill: "#000", fontSize: 14, fontWeight: "bold" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="transactions" radius={[8, 8, 0, 0]}>
                {customerData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    className={`transition-all duration-300 ${activeIndex === index ? "opacity-100" : "opacity-80"}`} 
                    stroke="#000" 
                    strokeWidth={3} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Type List */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {customerData.map((customer, index) => (
            <div
              key={`customer-${index}`}
              className={`
                relative group/item border-3 border-black p-3
                transform transition-all duration-300 hover:-translate-y-1
                ${activeIndex === index ? "bg-black text-white" : "bg-white"}
              `}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-3 border-black transform rotate-45 transition-transform group-hover/item:rotate-0" style={{ backgroundColor: COLORS[index] }} />
                <span className="font-bold text-lg">{customer.name}</span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="font-mono bg-white text-black px-2 py-1 border-2 border-black">{customer.transactions} TRANS</span>
                  <span className={`flex items-center ${customer.growthColor} font-bold`}>
                    <Zap size={16} className="mr-1" />
                    {customer.growth}
                  </span>
                </div>
              </div>
              <div className="absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10" />
            </div>
          ))}
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-2 -right-2 bg-blue-300 border-2 border-black p-1 transform rotate-12">
          <Zap size={20} />
        </div>
        <div className="absolute -bottom-2 -left-2 bg-purple-400 border-2 border-black p-1 transform -rotate-12">
          <BarChart2 size={20} />
        </div>
      </div>
    </div>
  );
};

export default CustomerTransactionsChart;