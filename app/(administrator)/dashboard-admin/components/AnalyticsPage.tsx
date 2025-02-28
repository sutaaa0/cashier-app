import CustomerTransactionsChart from "./CutomerTransactionsChart";
import { LowStockProductsChart } from "./LowStockProductChart";
import { RevenueByCategoryChart } from "./RevenueByCategoryChart";
import { TopSellingProducts } from "./TopSellingProduct";
import SalesOverTime from "./SalesOverTime";

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">ANALYTICS</h2>
      </div>

      <div className="flex flex-col gap-4">
        <div className="cursor-pointer">
          <SalesOverTime />
        </div>
        <div className="cursor-pointer">
          <TopSellingProducts />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="cursor-pointer">
            <CustomerTransactionsChart />
          </div>
          <div className="cursor-pointer">
            <LowStockProductsChart />
          </div>
        </div>
      </div>
      <div className="cursor-pointer">
        <RevenueByCategoryChart />
      </div>
    </div>
  );
}
