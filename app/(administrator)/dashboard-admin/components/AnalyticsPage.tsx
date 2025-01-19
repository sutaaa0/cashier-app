"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipItem } from "@/components/ui/chart"
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

// Mock data
const dailySales = [
  { date: '2023-07-01', sales: 1200 },
  { date: '2023-07-02', sales: 1800 },
  { date: '2023-07-03', sales: 1400 },
  { date: '2023-07-04', sales: 2200 },
  { date: '2023-07-05', sales: 1600 },
  { date: '2023-07-06', sales: 2000 },
  { date: '2023-07-07', sales: 2400 },
]

const topProducts = [
  { name: 'Espresso', sales: 450 },
  { name: 'Latte', sales: 300 },
  { name: 'Cappuccino', sales: 250 },
  { name: 'Mocha', sales: 200 },
  { name: 'Americano', sales: 180 },
]

const customerTransactions = [
  { name: 'Regular', value: 60 },
  { name: 'Member', value: 40 },
]

const lowStockProducts = [
  { name: 'Coffee Beans', stock: 15 },
  { name: 'Milk', stock: 8 },
  { name: 'Sugar', stock: 5 },
  { name: 'Cups', stock: 20 },
  { name: 'Lids', stock: 12 },
]

const categoryRevenue = [
  { category: 'Hot Drinks', revenue: 5000 },
  { category: 'Cold Drinks', revenue: 3500 },
  { category: 'Pastries', revenue: 2000 },
  { category: 'Snacks', revenue: 1500 },
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('daily')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">ANALYTICS</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px] bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales Over Time */}
        <Card className="border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <CardTitle>Sales Over Time</CardTitle>
            <CardDescription>Daily sales for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              sales: {
                label: "Sales",
                color: "hsl(var(--chart-1))"
              },
            }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="var(--color-sales)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card className="border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing products</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              sales: {
                label: "Sales",
                color: "hsl(var(--chart-2))"
              },
            }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="var(--color-sales)" />
              </BarChart>
            </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Customer Transactions */}
        <Card className="border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <CardTitle>Customer Transactions</CardTitle>
            <CardDescription>Member vs Non-Member transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              value: {
                label: "Value",
                color: "hsl(var(--chart-3))"
              },
            }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={customerTransactions}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {customerTransactions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card className="border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <CardTitle>Low Stock Products</CardTitle>
            <CardDescription>Products that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              stock: {
                label: "Stock",
                color: "hsl(var(--chart-4))"
              },
            }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={lowStockProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="stock" fill="var(--color-stock)" />
              </BarChart>
            </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue by Category */}
        <Card className="border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:col-span-2">
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
            <CardDescription>Revenue breakdown by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              revenue: {
                label: "Revenue",
                color: "hsl(var(--chart-5))"
              },
            }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="var(--color-revenue)" />
              </BarChart>
            </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

