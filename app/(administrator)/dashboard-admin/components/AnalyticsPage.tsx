import CustomerTransactionsChart from "./CutomerTransactionsChart";
import { LowStockProductsChart } from "./LowStockProductChart";
import { RevenueByCategoryChart } from "./RevenueByCategoryChart";
import { TopSellingProducts } from "./TopSellingProduct";
import SalesOverTime from "./SalesOverTime";

  // Profit Margin (%) = (Profit / Total Sales) * 100
  // profit = total sales - total modal

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">ANALISIS</h2>
      </div>

      <div className="flex flex-col gap-4">
        <div className="cursor-pointer">
          <SalesOverTime />
        </div>
        <div className="cursor-pointer">
          {/* Mengambil total penjualan produk dalam 1 bulan terakhir */}
          <TopSellingProducts />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="cursor-pointer">
            <CustomerTransactionsChart />
            {/* Data saat ini (30 hari terakhir) */}
          </div>
          <div className="cursor-pointer">
            <LowStockProductsChart />
          </div>
        </div>
      </div>
      <div className="cursor-pointer">
        <RevenueByCategoryChart />
        {/* data diambil dari awal bulan berjalan hingga saat ini */}
      </div>
    </div>
  );
}
