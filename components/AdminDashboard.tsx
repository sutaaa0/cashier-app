"use client";
import { SalesTrend } from "@/app/(administrator)/dashboard-admin/tes/SalesTrand";
import { InventoryManagement } from "@/app/(administrator)/dashboard-admin/tes/InventoryManagement";
import { PromotionAnalysis } from "@/app/(administrator)/dashboard-admin/tes/PromotionAnalysis";
import TopSellingProducts from "./TopSellingProducts";
import LowStockAlert from "./LowStockAlert";
import TopCustomers from "./TopCustomers";
import CashierPerforma from "./CashierPerforma";
import Revenue from "./Revenue";
import Transactions from "./Transactions";
import Member from "./Member";
import RevenueChart from "./RevenueChart";
import CategorySalesSummary from "./CategorySalesSummary";
import PeakHoursAnalysis from "./PeakHoursAnalysis";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-[#F3F3F3] p-6">
      <h1 className="text-4xl font-black mb-8 transform -rotate-1">ADMIN DASHBOARD</h1>

      {/* Daily Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Revenue */}
        <Revenue />

        {/* Transactions */}
        <Transactions />

        {/* Customers */}
        <Member />
      </div>

      {/* Revenue Chart */}
      <RevenueChart />

      {/* New Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Category Sales Summary */}
        <CategorySalesSummary />

        {/* Cashier Performance */}
        <CashierPerforma />
      </div>

      {/* Peak Hours Analysis */}
      <PeakHoursAnalysis />

      {/* SalesTrend and InventoryManagement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <SalesTrend />
        <InventoryManagement />
      </div>

      {/* Promotion Analysis */}
      <PromotionAnalysis />

      {/* Products and Customers Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <TopSellingProducts />

        {/* Low Stock Products */}
        <LowStockAlert />

        {/* Top Customers */}
        <TopCustomers />
      </div>
    </div>
  );
}
