"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Percent } from "lucide-react"
import { formatRupiah } from "@/lib/formatIdr"
import { useEffect, useState } from "react";
import { getPromotionAnalytics } from "@/server/actions";

interface PromotionAnalytics {
  name: string;
  revenue: number;
  transactions: number;
}


export function PromotionAnalysis() {
  const [promotionData, setPromotionData] = useState<PromotionAnalytics[]>([])
  useEffect(() => {
    const fetchData = async () => {
      const res = await getPromotionAnalytics();
      setPromotionData(res);
      console.log("data promosi :",res)
    }
    fetchData()
  }, [])
  
  return (
    <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Analisis Promosi</h2>
        <Percent size={24} className="text-purple-500" />
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={promotionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip
              formatter={(value, name) => [
                name === "revenue" ? formatRupiah(value as number) : value,
                name === "revenue" ? "Pendapatan" : "Transaksi",
              ]}
            />
            <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Pendapatan" />
            <Bar yAxisId="right" dataKey="transactions" fill="#82ca9d" name="Transaksi" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-3 border-2 border-black bg-purple-100">
          <p className="font-bold">Promosi Terbaik</p>
          <p className="text-sm">Flash Sale</p>
        </div>
        <div className="p-3 border-2 border-black bg-green-100">
          <p className="font-bold">Total Pendapatan Promosi</p>
          <p className="text-sm">{formatRupiah(promotionData.reduce((sum, promo) => sum + promo.revenue, 0))}</p>
        </div>
      </div>
    </div>
  )
}

