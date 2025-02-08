import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import SalesOverTime from "./SalesOverTime";
import CustomerTransactionsChart  from "./CutomerTransactionsChart";
import { LowStockProductsChart } from "./LowStockProductChart";
import { RevenueByCategoryChart } from "./RevenueByCategoryChart";
import { TopSellingProducts } from "./TopSellingProduct";

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("daily");

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
        <SalesOverTime />
        <TopSellingProducts />
        <CustomerTransactionsChart />
        <LowStockProductsChart />
        <RevenueByCategoryChart />
      </div>
    </div>
  );
}
