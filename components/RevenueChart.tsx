"use client";
import { formatRupiah } from "@/lib/formatIdr";
import { getRevenueChartData } from "@/server/actions";
import React, { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface ChartPeriod {
  period: "daily" | "weekly" | "monthly" | "yearly";
}

interface ChartDataItem {
  name: string;
  amount: number;
}

const RevenueChart = () => {
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  const fetchChartData = async (period: ChartPeriod["period"]): Promise<void> => {
    try {
      setIsLoadingChart(true);
      const data: ChartDataItem[] = await getRevenueChartData(period);
      setChartData(data);
    } catch (error: unknown) {
      console.error("Error fetching chart data:", error);
    } finally {
      setIsLoadingChart(false);
    }
  };

  useEffect(() => {
    fetchChartData(selectedTimePeriod);
    console.log(chartData);
  }, [selectedTimePeriod]);

  return (
    <div className="bg-white border-4 border-black p-6 mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Revenue Chart</h2>
        <select value={selectedTimePeriod} onChange={(e) => setSelectedTimePeriod(e.target.value as "daily" | "weekly" | "monthly" | "yearly")} className="border-2 border-black px-2 py-1">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <div className="h-[400px]">
        {isLoadingChart ? (
          <div className="h-full flex items-center justify-center">
            <p>Loading chart data...</p>
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
              <Line type="monotone" dataKey="amount" stroke="#000" strokeWidth={3} dot={{ stroke: "#000", strokeWidth: 2, fill: "#fff" }} activeDot={{ stroke: "#000", strokeWidth: 2, fill: "#000", r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default RevenueChart;
