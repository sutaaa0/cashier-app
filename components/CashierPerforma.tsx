import React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { formatRupiah } from "@/lib/formatIdr";
import { getCashierPerformance } from "@/server/actions";

// Interface untuk statistik kasir
interface CashierStats {
  name: string;
  transactions: number;
  sales: number;
}

// Interface untuk custom tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}

const CashierPerforma = () => {
  // Menggunakan React Query untuk fetching data
  const { 
    data: performance = [], 
    isLoading, 
    error 
  } = useQuery<CashierStats[]>({
    // Kunci query unik
    queryKey: ['cashierPerformanceData'],
    
    // Fungsi untuk mengambil data performa kasir
    queryFn: async () => {
      return getCashierPerformance();
    },
    
    // Refresh data setiap 3 detik
    refetchInterval: 3000,
    
    // Pertahankan data sebelumnya selama loading
    placeholderData: (previousData) => previousData,
  });

  // Custom Tooltip Komponen
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border-2 border-black shadow-lg">
          <p className="font-bold">{label}</p>
          <p className="text-[#8884d8]">Transaksi: {payload.find(p => p.name === 'Transactions')?.value}</p>
          <p className="text-[#82ca9d]">Penjualan: {formatRupiah(payload.find(p => p.name === 'Sales')?.value || 0)}</p>
        </div>
      );
    }
    return null;
  };

  // Tampilan loading
  if (isLoading) {
    return (
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
        <p className="text-center">memuat data...</p>
      </div>
    );
  }

  // Tampilan error
  if (error) {
    return (
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
        <p className="text-center text-red-500">gagal memuat data</p>
      </div>
    );
  }

  // Tampilan utama
  return (
    <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
      <h2 className="text-2xl font-bold mb-4">Kinerja Kasir</h2>
      <div className="h-[650px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={performance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              stroke="#8884d8"
              label={{ value: 'Total Transaksi', angle: -90, position: 'insideLeft' }} 
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#82ca9d"
              label={{ value: 'Total Penjualan (Rp)', angle: 90, position: 'insideRight' }} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar yAxisId="left" dataKey="transactions" fill="#8884d8" name="Transactions" />
            <Bar yAxisId="right" dataKey="sales" fill="#82ca9d" name="Sales" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CashierPerforma;