"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import {
  AlertCircle,
  DollarSign,
  Users,
  Package,
  ArrowUp,
  ArrowDown,
  ShoppingCart,
  Star,
  TrendingUp,
  Clock,
  Percent,
} from "lucide-react"
import { getTransactions, getProducts, getPelanggan, getRevenue } from "@/server/actions"
import { formatRupiah } from "@/lib/formatIdr"
import { SalesTrend } from "@/app/(administrator)/dashboard-admin/tes/SalesTrand"
import { InventoryManagement } from "@/app/(administrator)/dashboard-admin/tes/InventoryManagement"
import { PromotionAnalysis } from "@/app/(administrator)/dashboard-admin/tes/PromotionAnalysis"

// Mock data for different time periods
const chartData = {
  daily: Array.from({ length: 24 }, (_, i) => ({
    name: `${i}:00`,
    amount: Math.floor(Math.random() * 1000000) + 500000,
  })),
  weekly: Array.from({ length: 7 }, (_, i) => ({
    name: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
    amount: Math.floor(Math.random() * 5000000) + 1000000,
  })),
  monthly: Array.from({ length: 30 }, (_, i) => ({
    name: `Day ${i + 1}`,
    amount: Math.floor(Math.random() * 10000000) + 2000000,
  })),
  yearly: [
    { name: "Jan", amount: 12000000 },
    { name: "Feb", amount: 15000000 },
    { name: "Mar", amount: 18000000 },
    { name: "Apr", amount: 16000000 },
    { name: "May", amount: 21000000 },
    { name: "Jun", amount: 19000000 },
    { name: "Jul", amount: 22000000 },
    { name: "Aug", amount: 25000000 },
    { name: "Sep", amount: 23000000 },
    { name: "Oct", amount: 20000000 },
    { name: "Nov", amount: 24000000 },
    { name: "Dec", amount: 28000000 },
  ],
}

// Mock data for top selling products
const topSellingProducts = [
  { name: "Product A", sold: 1234, revenue: 15000000, growth: 25 },
  { name: "Product B", sold: 987, revenue: 12000000, growth: 15 },
  { name: "Product C", sold: 865, revenue: 9000000, growth: -5 },
  { name: "Product D", sold: 754, revenue: 7500000, growth: 10 },
]

// New mock data for category sales
const categorySales = [
  { name: "Makanan", value: 4000 },
  { name: "Minuman", value: 3000 },
  { name: "Snack", value: 2000 },
  { name: "Lainnya", value: 1000 },
]

// New mock data for cashier performance
const cashierPerformance = [
  { name: "Ani", transactions: 150, sales: 5000000 },
  { name: "Budi", transactions: 120, sales: 4500000 },
  { name: "Citra", transactions: 100, sales: 3800000 },
  { name: "Doni", transactions: 80, sales: 3000000 },
]

// New mock data for peak hours
const peakHours = [
  { hour: "08:00", customers: 10 },
  { hour: "10:00", customers: 25 },
  { hour: "12:00", customers: 55 },
  { hour: "14:00", customers: 40 },
  { hour: "16:00", customers: 30 },
  { hour: "18:00", customers: 45 },
  { hour: "20:00", customers: 20 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function AdminDashboard() {
  const [dailyStats, setDailyStats] = useState({
    revenue: 0,
    previousRevenue: 0, // Data untuk transaksi sebelumnya (kemarin)
  })
  const [revenueTimePeriod, setRevenueTimePeriod] = useState("today")
  const [realData, setRealData] = useState({})

  const [lowStockProducts, setLowStockProducts] = useState([])
  const [topCustomers, setTopCustomers] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("monthly")


  useEffect(() => {
    fetchDashboardData()
  }, [])



  const fetchDashboardData = async () => {
    try {
      // Implement your data fetching logic here
      // const transactions = await getTransactions()
      // const products = await getProducts()
      // const customers = await getPelanggan()
      const dataRevenue = await getRevenue()
      setRealData(dataRevenue)
      setDailyStats({
        revenue: dataRevenue.today,
        previousRevenue: dataRevenue.yesterday, // Misalnya `dataRevenue.yesterday` adalah revenue kemarin
      })


      console.log("data revenui :",dataRevenue);
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    }
  }


  const getChangePercentage = () => {
    const { revenue, previousRevenue } = dailyStats
    if (!previousRevenue || previousRevenue === 0) return 0 // Untuk menghindari pembagian dengan 0
    return ((revenue - previousRevenue) / previousRevenue) * 100
  }



  return (
    <div className="min-h-screen bg-[#F3F3F3] p-6">
      <h1 className="text-4xl font-black mb-8 transform -rotate-1">ADMIN DASHBOARD</h1>

      {/* Daily Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Revenue</h2>
            <select
              value={revenueTimePeriod}
              onChange={(e) => setRevenueTimePeriod(e.target.value)}
              className="border-2 border-black px-2 py-1"
            >
              <option value="today">Today</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
              <option value="thisYear">This Year</option>
            </select>

          </div>
          <p className="text-3xl font-black">{formatRupiah(dailyStats.revenue)}</p>
        <div className={`flex items-center mt-2 ${getChangePercentage() >= 0 ? "text-green-500" : "text-red-500"}`}>
          {getChangePercentage() >= 0 ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
          <span className="font-bold">{Math.abs(getChangePercentage()).toFixed(2)}% vs previous period</span>
        </div>        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Transactions</h2>
            <ShoppingCart size={24} className="text-blue-500" />
          </div>
          <p className="text-3xl font-black">24</p>
          <div className="flex items-center mt-2 text-blue-500">
            <ArrowUp size={20} />
            <span className="font-bold">8 more than yesterday</span>
          </div>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">New Customers</h2>
            <Users size={24} className="text-purple-500" />
          </div>
          <p className="text-3xl font-black">5</p>
          <div className="flex items-center mt-2 text-purple-500">
            <ArrowUp size={20} />
            <span className="font-bold">2 more than yesterday</span>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white border-4 border-black p-6 mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Revenue Chart</h2>
          <select
            value={selectedTimePeriod}
            onChange={(e) => setSelectedTimePeriod(e.target.value)}
            className="border-2 border-black px-2 py-1"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData[selectedTimePeriod]}>
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
                formatter={(value) => formatRupiah(value)}
              />
              <Line type="monotone" dataKey="amount" stroke="#000" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* New Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Category Sales Summary */}
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
          <h2 className="text-2xl font-bold mb-4">Penjualan per Kategori</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categorySales}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cashier Performance */}
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
          <h2 className="text-2xl font-bold mb-4">Performa Kasir</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashierPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="transactions" fill="#8884d8" name="Transaksi" />
                <Bar yAxisId="right" dataKey="sales" fill="#82ca9d" name="Penjualan" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Peak Hours Analysis */}
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Analisis Waktu Puncak</h2>
          <Clock size={24} className="text-blue-500" />
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="customers" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* New Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <SalesTrend />
        <InventoryManagement />
      </div>

      <PromotionAnalysis />

      {/* Products and Customers Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Top Selling Products</h2>
            <TrendingUp size={24} className="text-green-500" />
          </div>
          <div className="space-y-4">
            {topSellingProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-3 border-2 border-black">
                <div>
                  <p className="font-bold">{product.name}</p>
                  <p className="text-sm">Sold: {product.sold} units</p>
                  <p className="text-sm">{formatRupiah(product.revenue)}</p>
                </div>
                <div
                  className={`px-2 py-1 font-bold border-2 border-black transform rotate-1 
                  ${product.growth >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {product.growth >= 0 ? "+" : ""}
                  {product.growth}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Low Stock Alert</h2>
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border-2 border-black bg-red-100">
              <div>
                <p className="font-bold">Roti Tawar</p>
                <p className="text-sm">Only 5 items left</p>
              </div>
              <Package size={20} />
            </div>
            <div className="flex items-center justify-between p-3 border-2 border-black bg-yellow-100">
              <div>
                <p className="font-bold">Donat Coklat</p>
                <p className="text-sm">Only 8 items left</p>
              </div>
              <Package size={20} />
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Top Customers</h2>
            <Star size={24} className="text-yellow-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border-2 border-black">
              <div>
                <p className="font-bold">John Doe</p>
                <p className="text-sm">Total spent: {formatRupiah(1500000)}</p>
              </div>
              <div className="bg-yellow-400 px-2 py-1 font-bold border-2 border-black transform rotate-3">
                #1 Customer
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border-2 border-black">
              <div>
                <p className="font-bold">Jane Smith</p>
                <p className="text-sm">Total spent: {formatRupiah(1200000)}</p>
              </div>
              <div className="bg-gray-200 px-2 py-1 font-bold border-2 border-black transform -rotate-2">
                #2 Customer
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

