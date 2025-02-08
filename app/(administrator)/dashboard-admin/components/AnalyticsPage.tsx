import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import CustomerTransactionsChart from "./CutomerTransactionsChart";
import { LowStockProductsChart } from "./LowStockProductChart";
import { RevenueByCategoryChart } from "./RevenueByCategoryChart";
import { TopSellingProducts } from "./TopSellingProduct";
import SalesOverTime from "./SalesOverTime";

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("daily");
  // State untuk menentukan chart yang sedang diperbesar (expanded)
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  // Fungsi untuk "zoom" sebuah chart
  const handleExpand = (chartName: string) => {
    setExpandedChart(chartName);
  };

  // Fungsi untuk kembali ke tampilan semua chart
  const handleCollapse = () => {
    setExpandedChart(null);
  };

  // Jika ada chart yang diperbesar, render hanya chart tersebut dengan tombol kembali
  if (expandedChart) {
    return (
      <div className="relative">
        <button onClick={handleCollapse} className="absolute top-4 left-4 z-10 bg-white border border-black px-4 py-2 font-bold shadow-md">
          Kembali
        </button>
        <div className="p-6">
          {expandedChart === "SalesOverTime" && <SalesOverTime />}
          {expandedChart === "TopSellingProducts" && <TopSellingProducts />}
          {expandedChart === "CustomerTransactionsChart" && <CustomerTransactionsChart />}
          {expandedChart === "LowStockProductsChart" && <LowStockProductsChart />}
          {expandedChart === "RevenueByCategoryChart" && <RevenueByCategoryChart />}
        </div>
      </div>
    );
  }

  // Tampilan default: semua chart ditampilkan
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

      <div className="flex flex-col gap-4">
        <div className="cursor-pointer" onClick={() => handleExpand("SalesOverTime")}>
          <SalesOverTime />
        </div>
        <div className="cursor-pointer" onClick={() => handleExpand("TopSellingProducts")}>
          <TopSellingProducts />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="cursor-pointer" onClick={() => handleExpand("CustomerTransactionsChart")}>
            <CustomerTransactionsChart />
          </div>
          <div className="cursor-pointer" onClick={() => handleExpand("LowStockProductsChart")}>
            <LowStockProductsChart />
          </div>
        </div>
      </div>
      <div className="cursor-pointer" onClick={() => handleExpand("RevenueByCategoryChart")}>
        <RevenueByCategoryChart />
      </div>
    </div>
  );
}
