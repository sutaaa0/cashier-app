import React, { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatRupiah } from "@/lib/formatIdr";
import { getCashierPerformance } from "@/server/actions";

interface CashierStats {
  name: string;
  transactions: number;
  sales: number;
}

const CashierPerforma = () => {
  const [performance, setPerformance] = useState<CashierStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getCashierPerformance();
        if (Array.isArray(data)) {
          setPerformance(data);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Opsional: Update data setiap 5 menit
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
        <p className="text-center">Memuat data...</p>
      </div>
    );
  }

  console.log(performance);

  interface CustomTooltipProps {
    active?: boolean;
    payload?: { value: number }[];
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border-2 border-black shadow-lg">
          <p className="font-bold">{label}</p>
          <p className="text-[#8884d8]">Transaksi: {payload[0].value}</p>
          <p className="text-[#82ca9d]">Penjualan: {formatRupiah(payload[1].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
      <h2 className="text-2xl font-bold mb-4">Performa Kasir</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={performance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              stroke="#8884d8"
              label={{ value: 'Jumlah Transaksi', angle: -90, position: 'insideLeft' }} 
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#82ca9d"
              label={{ value: 'Total Penjualan (Rp)', angle: 90, position: 'insideRight' }} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar yAxisId="left" dataKey="transactions" fill="#8884d8" name="Transaksi" />
            <Bar yAxisId="right" dataKey="sales" fill="#82ca9d" name="Penjualan" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CashierPerforma;