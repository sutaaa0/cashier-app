import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowUp, ArrowDown } from "lucide-react"
import { formatRupiah } from "@/lib/formatIdr"

const mockData = {
  thisWeek: [
    { day: "Sen", sales: 5000000 },
    { day: "Sel", sales: 5500000 },
    { day: "Rab", sales: 4800000 },
    { day: "Kam", sales: 6200000 },
    { day: "Jum", sales: 7000000 },
    { day: "Sab", sales: 8500000 },
    { day: "Min", sales: 7500000 },
  ],
  lastWeek: [
    { day: "Sen", sales: 4800000 },
    { day: "Sel", sales: 5200000 },
    { day: "Rab", sales: 4500000 },
    { day: "Kam", sales: 5800000 },
    { day: "Jum", sales: 6500000 },
    { day: "Sab", sales: 8000000 },
    { day: "Min", sales: 7000000 },
  ],
  lastYearSameWeek: [
    { day: "Sen", sales: 4200000 },
    { day: "Sel", sales: 4500000 },
    { day: "Rab", sales: 4000000 },
    { day: "Kam", sales: 5000000 },
    { day: "Jum", sales: 5500000 },
    { day: "Sab", sales: 7000000 },
    { day: "Min", sales: 6000000 },
  ],
}

export function SalesTrend() {
  const [period, setPeriod] = useState("thisWeek")
  const [comparisonPeriod, setComparisonPeriod] = useState("lastWeek")

  const data = mockData[period as keyof typeof mockData]
  const comparisonData = mockData[comparisonPeriod as keyof typeof mockData]

  const totalSales = data.reduce((sum, day) => sum + day.sales, 0)
  const comparisonSales = comparisonData.reduce((sum, day) => sum + day.sales, 0)
  const growthPercentage = ((totalSales - comparisonSales) / comparisonSales) * 100

  return (
    <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Analisis Penjualan Mingguan</h2>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border-2 border-black px-2 py-1"
          >
            <option value="thisWeek">Minggu Ini</option>
            <option value="lastWeek">Minggu Lalu</option>
            <option value="lastYearSameWeek">Minggu Sama Tahun Lalu</option>
          </select>
          <select
            value={comparisonPeriod}
            onChange={(e) => setComparisonPeriod(e.target.value)}
            className="border-2 border-black px-2 py-1"
          >
            <option value="lastWeek">vs Minggu Lalu</option>
            <option value="lastYearSameWeek">vs Minggu Sama Tahun Lalu</option>
          </select>
        </div>
      </div>
      <div className="mb-4">
        <p className="text-3xl font-bold">{formatRupiah(totalSales)}</p>
        <div className="flex items-center mt-2">
          {growthPercentage >= 0 ? (
            <ArrowUp className="text-green-500 mr-1" />
          ) : (
            <ArrowDown className="text-red-500 mr-1" />
          )}
          <span className={growthPercentage >= 0 ? "text-green-500" : "text-red-500"}>
            {Math.abs(growthPercentage).toFixed(2)}% vs periode perbandingan
          </span>
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip formatter={(value) => formatRupiah(value as number)} />
            <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} />
            <Line
              type="monotone"
              data={comparisonData}
              dataKey="sales"
              stroke="#82ca9d"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>Garis solid: Periode yang dipilih</p>
        <p>Garis putus-putus: Periode perbandingan</p>
      </div>
    </div>
  )
}

