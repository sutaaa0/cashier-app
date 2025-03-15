"use client"

import { useQuery } from "@tanstack/react-query"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowUp, ArrowDown } from 'lucide-react'
import { formatRupiah } from "@/lib/formatIdr"
import { getSalesTrendData } from "@/server/actions"

// Interface untuk data penjualan harian
interface SalesData {
  day: string
  sales: number
}

// Interface untuk data tren penjualan
interface SalesTrendData {
  thisWeek: SalesData[]
  lastWeek: SalesData[]
}

export function SalesTrend() {
  // Menggunakan React Query untuk fetching data
  const { 
    data, 
    isLoading, 
    error 
  } = useQuery<SalesTrendData>({
    // Kunci query unik
    queryKey: ['salesTrendData'],
    
    // Fungsi untuk mengambil data tren penjualan
    queryFn: getSalesTrendData,
    
    // Refresh data setiap 3 menit
    refetchInterval: 3000,
    
    // Pertahankan data sebelumnya selama loading
    placeholderData: (previousData) => previousData,
  });

  // Tampilan loading
  if (isLoading) {
    return (
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
        <p className="text-center">Loading data...</p>
      </div>
    )
  }

  // Tampilan error
  if (error || !data) {
    return (
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
        <p className="text-center text-red-500">Failed to load data</p>
      </div>
    )
  }

  // Hitung total penjualan minggu ini dan minggu lalu
  const thisWeekSales = data.thisWeek.reduce((sum, day) => sum + day.sales, 0)
  const lastWeekSales = data.lastWeek.reduce((sum, day) => sum + day.sales, 0)

  // Hitung pertumbuhan
  let growthDisplay: string
  let isPositiveGrowth: boolean

  if (lastWeekSales === 0) {
    if (thisWeekSales === 0) {
      growthDisplay = "0,00"
      isPositiveGrowth = true
    } else {
      growthDisplay = "100,00"
      isPositiveGrowth = true
    }
  } else {
    const growthPercentage = ((thisWeekSales - lastWeekSales) / lastWeekSales) * 100
    growthDisplay = Math.abs(growthPercentage).toFixed(2)
    isPositiveGrowth = growthPercentage >= 0
  }

  // Memastikan data hanya untuk satu minggu
  const weekDays = ['Mon', 'Tue', 'Sad', 'Thu', 'Fri', 'Sat', 'Sun']
  const combinedData = weekDays.map((day, index) => ({
    day,
    thisWeek: data.thisWeek[index]?.sales || 0,
    lastWeek: data.lastWeek[index]?.sales || 0
  }))

  return (
    <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Weekly Sales Analysis</h2>
      </div>
      <div className="mb-4">
        <p className="text-3xl font-bold">{formatRupiah(thisWeekSales)}</p>
        <div className="flex items-center mt-2">
          {isPositiveGrowth ? (
            <ArrowUp className="text-green-500 mr-1" />
          ) : (
            <ArrowDown className="text-red-500 mr-1" />
          )}
          <span className={isPositiveGrowth ? "text-green-500" : "text-red-500"}>
            {growthDisplay}% vs Last week
            {lastWeekSales === 0 && thisWeekSales > 0 && " (no transactions last week)"}
          </span>
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combinedData} margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="day"
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip 
              formatter={(value) => formatRupiah(value as number)}
              labelFormatter={(label) => `Hari: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="thisWeek"
              stroke="#8884d8"
              strokeWidth={2}
              name="This Week"
              dot={{ strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="lastWeek"
              stroke="#82ca9d"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Last Week"
              dot={{ strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>Solid line: This week </p>
        <p>Dotted line: Last week </p>
      </div>
    </div>
  )
}