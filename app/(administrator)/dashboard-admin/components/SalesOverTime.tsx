import React, { useState, useEffect } from "react";
import {
  ArrowUp,
  ArrowDown,
  DollarSign,
  TrendingUp,
  Sparkles,
  LineChart as LineChartIcon,
  Calendar,
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
import { 
  getProfitData,  
} from "@/server/actions";
import type { ProfitData, TimeRange } from "@/server/actions";
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
              {label || ""}
            </h3>
          </div>
          {payload.map((entry, index) => (
            <div
              key={index}
              className="font-mono bg-black text-white p-2 transform rotate-1 mt-2"
            >
              {entry.name === "sales" ? "Penjualan" : 
               entry.name === "profit" ? "Keuntungan" : 
               entry.name === "traffic" ? "Transaksi" : entry.name}:{" "}
              {["sales", "profit"].includes(entry.name)
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

const TimeRangeSelector = ({
  activeRange,
  onChange,
}: {
  activeRange: TimeRange;
  onChange: (range: TimeRange) => void;
}) => {
  const ranges: { label: string; value: TimeRange }[] = [
    { label: "Harian", value: "daily" },
    { label: "Mingguan", value: "weekly" },
    { label: "Bulanan", value: "monthly" },
    { label: "Tahunan", value: "yearly" },
  ];

  return (
    <div className="flex gap-2 mb-6">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className={`
            relative px-4 py-2 border-2 border-black font-bold 
            transform transition-all duration-300 hover:-translate-y-1
            ${
              activeRange === range.value
                ? "bg-black text-white"
                : "bg-white text-black"
            }
          `}
        >
          {range.label}
          <div
            className={`absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10 ${
              activeRange === range.value ? "bg-pink-400" : "bg-yellow-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

export default function ProfitAnalytics() {
  const [profitData, setProfitData] = useState<ProfitData[]>([]);
  const [currentPeriodStats, setCurrentPeriodStats] = useState<{
    sales: number;
    profit: number;
    transactions: number;
  }>({ sales: 0, profit: 0, transactions: 0 });
  const [previousPeriodStats, setPreviousPeriodStats] = useState<{
    sales: number;
    profit: number;
    transactions: number;
  }>({ sales: 0, profit: 0, transactions: 0 });
  const [timeRange, setTimeRange] = useState<TimeRange>("daily");
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getProfitData(timeRange);
        setProfitData(data);
        
        // Get latest period data (last item in the array)
        if (data.length > 0) {
          const latestData = data[data.length - 1];
          setCurrentPeriodStats({
            sales: latestData.sales,
            profit: latestData.profit,
            transactions: latestData.transactions
          });
          
          // Get previous period data (second to last item, if it exists)
          if (data.length > 1) {
            const previousData = data[data.length - 2];
            setPreviousPeriodStats({
              sales: previousData.sales,
              profit: previousData.profit,
              transactions: previousData.transactions
            });
          } else {
            // If no previous data, set to 0
            setPreviousPeriodStats({
              sales: 0,
              profit: 0,
              transactions: 0
            });
          }
        }
        
        setIsLoaded(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % (profitData.length || 1));
    }, 3000);

    return () => clearInterval(interval);
  }, [timeRange]);

  // Function to calculate percentage increase/decrease
  const calculateIncrease = (current: number, previous: number) => {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
  };

  if (isLoading) {
    return <SalesOverTimeLoading />;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(value);
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "daily":
        return "Harian";
      case "weekly":
        return "Mingguan";
      case "monthly":
        return "Bulanan";
      case "yearly":
        return "Tahunan";
      default:
        return "Harian";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    switch (timeRange) {
      case "daily":
        return date.toLocaleDateString("id-ID");
      case "weekly":
        return `Minggu ${date.toLocaleDateString("id-ID")}`;
      case "monthly":
        return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      case "yearly":
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString("id-ID");
    }
  };

  // Get the period label for current stats
  const getTimePeriodLabel = () => {
    if (profitData.length === 0) return "";
    const latestDate = profitData[profitData.length - 1]?.date;
    if (!latestDate) return "";
    
    switch (timeRange) {
      case "daily":
        return `Hari Ini (${formatDate(latestDate)})`;
      case "weekly":
        return `Minggu Ini (${formatDate(latestDate)})`;
      case "monthly":
        return `Bulan Ini (${formatDate(latestDate)})`;
      case "yearly":
        return `Tahun Ini (${formatDate(latestDate)})`;
      default:
        return formatDate(latestDate);
    }
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
              ANALISIS KEUNTUNGAN
            </h2>
          </div>
          <div className="bg-black text-white p-3 transform rotate-3 hover:rotate-6 transition-transform">
            <LineChartIcon size={28} />
          </div>
        </div>

        {/* Time Range Selector */}
        <TimeRangeSelector activeRange={timeRange} onChange={setTimeRange} />

        <div
          className={`transform transition-all duration-1000 ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          {/* Stats Grid */}
          {isLoaded && profitData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatCard
                title={`Penjualan ${getTimePeriodLabel()}`}
                value={formatCurrency(currentPeriodStats.sales)}
                increase={calculateIncrease(currentPeriodStats.sales, previousPeriodStats.sales)}
                icon={DollarSign}
              />
              <StatCard
                title={`Keuntungan ${getTimePeriodLabel()}`}
                value={formatCurrency(currentPeriodStats.profit)}
                increase={calculateIncrease(currentPeriodStats.profit, previousPeriodStats.profit)}
                icon={Sparkles}
              />
              <StatCard
                title={`Transaksi ${getTimePeriodLabel()}`}
                value={currentPeriodStats.transactions.toString()}
                increase={calculateIncrease(currentPeriodStats.transactions, previousPeriodStats.transactions)}
                icon={TrendingUp}
              />
            </div>
          )}

          {/* Main Chart */}
          <div className="relative bg-white border-4 border-black p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg transform -rotate-1 bg-white border-2 border-black p-2 inline-block">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Laporan {getTimeRangeLabel()}
                </span>
              </h3>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <AreaChart
                data={profitData}
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
                    id="profitGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient
                    id="transactionsGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#FFD166" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#FFD166" stopOpacity={0.1} />
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
                  tickFormatter={formatDate}
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
                  dataKey="profit"
                  stroke="#4ECDC4"
                  fill="url(#profitGradient)"
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
                <Area
                  type="monotone"
                  dataKey="transactions"
                  stroke="#FFD166"
                  fill="url(#transactionsGradient)"
                  strokeWidth={4}
                  dot={{
                    stroke: "#000",
                    strokeWidth: 2,
                    fill: "#FFD166",
                    r: 6,
                  }}
                  activeDot={{
                    stroke: "#000",
                    strokeWidth: 4,
                    fill: "#FFD166",
                    r: 8,
                    className: "animate-pulse",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Statistics */}
          {!isLoading && profitData.length > 0 && (
            <div className="mt-6">
              <div className="mb-4 transform -rotate-1 bg-white border-4 border-black p-3 inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="font-black text-xl">RINGKASAN STATISTIK</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white border-4 border-black p-4">
                  <h4 className="text-lg font-bold mb-2">Analisis Keuntungan</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Total Penjualan:</span>
                      <span className="font-mono font-bold">{formatCurrency(profitData.reduce((sum, item) => sum + item.sales, 0))}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Total Keuntungan:</span>
                      <span className="font-mono font-bold">{formatCurrency(profitData.reduce((sum, item) => sum + item.profit, 0))}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Margin Keuntungan:</span>
                      <span className="font-mono font-bold">
                        {(
                          profitData.reduce((sum, item) => sum + item.profit, 0) / 
                          profitData.reduce((sum, item) => sum + item.sales, 0) * 100
                        ).toFixed(2)}%
                      </span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white border-4 border-black p-4">
                  <h4 className="text-lg font-bold mb-2">Analisis Transaksi</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Total Transaksi:</span>
                      <span className="font-mono font-bold">{profitData.reduce((sum, item) => sum + item.transactions, 0)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Rata-rata Nilai Transaksi:</span>
                      <span className="font-mono font-bold">
                        {formatCurrency(
                          profitData.reduce((sum, item) => sum + item.sales, 0) / 
                          profitData.reduce((sum, item) => sum + item.transactions, 0)
                        )}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Keuntungan per Transaksi:</span>
                      <span className="font-mono font-bold">
                        {formatCurrency(
                          profitData.reduce((sum, item) => sum + item.profit, 0) / 
                          profitData.reduce((sum, item) => sum + item.transactions, 0)
                        )}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Highlighted Data */}
          {!isLoading && profitData.length > 0 && (
            <div className="mt-6 grid grid-cols-3 gap-4">
              {(["sales", "profit", "transactions"] as const).map(
                (metric, index) => (
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
                          backgroundColor:
                            index === 0
                              ? "#FF6B6B"
                              : index === 1
                              ? "#4ECDC4"
                              : "#FFD166",
                        }}
                      />
                      <span className="font-bold text-lg capitalize">
                        {metric === "sales"
                          ? "Penjualan"
                          : metric === "profit"
                          ? "Keuntungan"
                          : "Transaksi"}
                      </span>
                      <span className="ml-auto font-mono bg-white text-black px-2 py-1 border-2 border-black">
                        {["sales", "profit"].includes(metric)
                          ? formatCurrency(
                              profitData[activeIndex]?.[metric] || 0
                            )
                          : profitData[activeIndex]?.[metric]}
                      </span>
                    </div>
                    <div className="absolute inset-0 border-2 border-black transform translate-x-1 translate-y-1 -z-10" />
                  </div>
                )
              )}
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