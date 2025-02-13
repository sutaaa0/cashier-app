"use client";

import { useState } from "react";
import { TransactionManagement } from "./components/TransactionManagement";
import { StockManagement } from "./components/StockManagement";
import { AnalyticsPage } from "./components/AnalyticsPage";
import { UserManagement } from "@/components/UserManagement";
import { CustomerManagement } from "@/components/CustomerManagement";
import { ReportManagement } from "./components/RepostManagement";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ProductManagement } from "@/components/ProductManagement";
import AdminDashboard from "@/components/AdminDashboard";
import { CategoryManagement } from "@/components/CategoryManagement";
import {PromotionManagement} from "@/components/PromotionManagement";

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <AdminDashboard />;
      case "users":
        return <UserManagement />;
      case "products":
        return <ProductManagement />;
      case "categories":
        return <CategoryManagement />;
      case "customers":
        return <CustomerManagement />;
      case "transactions":
        return <TransactionManagement />;
      case "stock":
        return <StockManagement />;
      case "promotion":
        return <PromotionManagement />;
      case "reports":
        return <ReportManagement />;
      case "analytics":
        return <AnalyticsPage />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <div className="h-screen bg-[#E8F1FE] font-mono overflow-y-hidden">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <main className="flex-1 p-8 overflow-scroll h-screen overflow-y-scroll pb-36">{renderSection()}</main>
      </div>
    </div>
  );
}
