import React, { useState, useEffect } from "react";
import {
  ArrowUp,
  ArrowDown,
  DollarSign,
  TrendingUp,
  Sparkles,
  LineChart as LineChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";
import { getDailySalesData, getSalesStats } from "@/server/actions";
import type { DailySalesData, SalesStats } from "@/server/actions";
import SalesOverTimeLoading from "./SalesOverTimeLoading";

const StatCard = ({
  title,
  value,
  increase,
  icon: Icon,
}: {
  title: string;
  value: string;
  increase: number;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}) => (
  <div className="relative group">
    <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
    <div className="relative bg-white border-4 border-black p-4 transform hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black uppercase">{title}</h3>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div
          className={`p-2 ${
            increase >= 0 ? "bg-green-300" : "bg-red-300"
          } border-2 border-black transform rotate-3 hover:rotate-6 transition-transform`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="mt-2 flex items-center">
        {increase >= 0 ? (
          <ArrowUp className="w-4 h-4 text-green-600" />
        ) : (
          <ArrowDown className="w-4 h-4 text-red-600" />
        )}
        <span className="ml-1 font-bold">{Math.abs(increase).toFixed(1)}%</span>
      </div>
      <div className="absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10" />
    </div>
  </div>
);

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        <div className="relative bg-white border-4 border-black p-4 transform -rotate-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-yellow-400" size={20} />
            <h3 className="font-black text-xl">
              {new Date(label || "").toLocaleDateString()}
            </h3>
          </div>
          {payload.map((entry, index) => (
            <div
              key={index}
              className="font-mono bg-black text-white p-2 transform rotate-1 mt-2"
            >
              {entry.name}:{" "}
              {entry.name === "sales"
                ? new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  }).format(entry.value)
                : entry.value}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function SalesOverTime() {
  const [salesData, setSalesData] = useState<DailySalesData[]>([]);
  const [statsData, setStatsData] = useState<SalesStats | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dailyData, stats] = await Promise.all([
          getDailySalesData(),
          getSalesStats(),
        ]);
        setSalesData(dailyData);
        setStatsData(stats);
        setIsLoading(false);
        setIsLoaded(true);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % (salesData.length || 1));
    }, 3000);

    return () => clearInterval(interval);
  }, [salesData.length]);

  if(isLoading) {
    return <SalesOverTimeLoading/>
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(value);
  };

  return (
    <div className="relative bg-white border-4 border-black p-6 transition-all duration-300 group">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute transform rotate-45 border-2 border-black"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: "20px",
              height: "20px",
            }}
          />
        ))}
      </div>

      {/* Glowing effect on hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />

      {/* Main content container */}
      <div className="relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="transform -rotate-2 bg-gradient-to-r from-yellow-300 to-yellow-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-black tracking-tighter">
              SALES ANALYTICS
            </h2>
          </div>
          <div className="bg-black text-white p-3 transform rotate-3 hover:rotate-6 transition-transform">
            <LineChartIcon size={28} />
          </div>
        </div>

        <div
          className={`transform transition-all duration-1000 ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          {/* Stats Grid */}
          {statsData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <StatCard
                title="Total Sales"
                value={formatCurrency(statsData.totalSales)}
                increase={statsData.salesIncrease}
                icon={DollarSign}
              />
              <StatCard
                title="Traffic"
                value={statsData.totalTraffic.toString()}
                increase={statsData.trafficIncrease}
                icon={TrendingUp}
              />
            </div>
          )}

          {/* Main Chart */}
          <div className="relative bg-white border-4 border-black p-6">

              <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                  data={salesData}
                  onMouseMove={(state) => {
                    if (state?.activeTooltipIndex !== undefined) {
                      setActiveIndex(state.activeTooltipIndex);
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient
                      id="trafficGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#000"
                    strokeWidth={2}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#000"
                    strokeWidth={2}
                    tick={{
                      fill: "#000",
                      fontSize: 14,
                      fontWeight: "bold",
                    }}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString()
                    }
                  />
                  <YAxis
                    stroke="#000"
                    strokeWidth={2}
                    tick={{
                      fill: "#000",
                      fontSize: 14,
                      fontWeight: "bold",
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#FF6B6B"
                    fill="url(#salesGradient)"
                    strokeWidth={4}
                    dot={{
                      stroke: "#000",
                      strokeWidth: 2,
                      fill: "#FF6B6B",
                      r: 6,
                    }}
                    activeDot={{
                      stroke: "#000",
                      strokeWidth: 4,
                      fill: "#FF6B6B",
                      r: 8,
                      className: "animate-pulse",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="traffic"
                    stroke="#4ECDC4"
                    fill="url(#trafficGradient)"
                    strokeWidth={4}
                    dot={{
                      stroke: "#000",
                      strokeWidth: 2,
                      fill: "#4ECDC4",
                      r: 6,
                    }}
                    activeDot={{
                      stroke: "#000",
                      strokeWidth: 4,
                      fill: "#4ECDC4",
                      r: 8,
                      className: "animate-pulse",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
          </div>

          {/* Highlighted Data */}
          {!isLoading && salesData.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              {(["sales", "traffic"] as const).map((metric, index) => (
                <div
                  key={`metric-${index}`}
                  className={`
                    relative group/item border-3 border-black p-3
                    transform transition-all duration-300 hover:-translate-y-1
                    ${activeIndex === index ? "bg-black text-white" : "bg-white"}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 border-3 border-black transform rotate-45 transition-transform group-hover/item:rotate-0"
                      style={{
                        backgroundColor: index === 0 ? "#FF6B6B" : "#4ECDC4",
                      }}
                    />
                    <span className="font-bold text-lg capitalize">
                      {metric}
                    </span>
                    <span className="ml-auto font-mono bg-white text-black px-2 py-1 border-2 border-black">
                      {metric === "sales"
                        ? formatCurrency(salesData[activeIndex]?.[metric] || 0)
                        : salesData[activeIndex]?.[metric]}
                    </span>
                  </div>
                  <div className="absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-2 -right-2 bg-yellow-300 border-2 border-black p-1 transform rotate-12">
          <TrendingUp size={20} />
        </div>
        <div className="absolute -bottom-2 -left-2 bg-pink-400 border-2 border-black p-1 transform -rotate-12">
          <Sparkles size={20} />
        </div>
      </div>
    </div>
  );
}
