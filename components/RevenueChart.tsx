"use client";

import { formatRupiah } from "@/lib/formatIdr";
import { getRevenueChartData } from "@/server/actions";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Interface untuk periode chart
interface ChartPeriod {
  period: "daily" | "weekly" | "monthly" | "yearly";
}

// Interface untuk data chart
interface ChartDataItem {
  name: string;
  amount: number;
}

const RevenueChart = () => {
  // State untuk memilih periode
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<ChartPeriod["period"]>("monthly");

  // Menggunakan React Query untuk fetching data
  const { 
    data: chartData = [], 
    isLoading: isLoadingChart, 
    error 
  } = useQuery<ChartDataItem[]>({
    // Kunci query unik yang berubah berdasarkan periode
    queryKey: ['revenueChartData', selectedTimePeriod],
    
    // Fungsi untuk mengambil data chart
    queryFn: () => getRevenueChartData(selectedTimePeriod),
    
    // Refresh data setiap 3 detik
    refetchInterval: 3000,
    
    // Pertahankan data sebelumnya selama loading
    placeholderData: (previousData) => previousData,
  });

  return (
    <div className="bg-white border-4 border-black p-6 mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Revenue Chart</h2>
        <select 
          value={selectedTimePeriod} 
          onChange={(e) => setSelectedTimePeriod(e.target.value as ChartPeriod["period"])} 
          className="border-2 border-black px-2 py-1"
        >
          <option value="daily">Harian</option>
          <option value="weekly">Mingguan</option>
          <option value="monthly">Bulanan</option>
          <option value="yearly">Tahunan</option>
        </select>
      </div>
      
      <div className="h-[400px]">
        {isLoadingChart ? (
          <div className="h-full flex items-center justify-center">
            <p>Memuat data chart...</p>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-red-500">
            <p>Error memuat data chart</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "2px solid black",
                  borderRadius: "0px",
                  padding: "10px",
                }}
                formatter={(value) => formatRupiah(value as number)}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#000" 
                strokeWidth={3} 
                dot={{ stroke: "#000", strokeWidth: 2, fill: "#fff" }} 
                activeDot={{ stroke: "#000", strokeWidth: 2, fill: "#000", r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default RevenueChart;