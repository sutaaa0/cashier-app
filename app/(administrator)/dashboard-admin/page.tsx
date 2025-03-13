"use client";

import { useEffect, useState } from "react";
import { TransactionManagement } from "./components/TransactionManagement";
import { StockManagement } from "./components/StockManagement";
import { AnalyticsPage } from "./components/AnalyticsPage";
import { UserManagement } from "@/components/UserManagement";
import { CustomerManagement } from "@/components/CustomerManagement";
import { ReportManagement } from "./components/ReportManagement";
import { AdminHeader } from "@/components/AdminHeader";
import { AdminSidebar } from "@/components/AdminSidebar";
import { ProductManagement } from "@/components/ProductManagement";
import AdminDashboard from "@/components/AdminDashboard";
import { CategoryManagement } from "@/components/CategoryManagement";
import PromotionPage from "@/components/PromotionPage";
import { getCurrentUser } from "@/server/actions";
import { redirect } from "next/navigation";
import { useRouter } from "next/navigation";
import { NeoProgressIndicator } from "@/components/NeoProgresIndicator";

export default function AdminPage() {
  const router = useRouter();
  // All useState hooks must be called at the top level, before any conditional logic
  const [isAuth, setIsAuth] = useState(true); // Initialize to true to show loading state
  const [activeSection, setActiveSection] = useState("dashboard");

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        // Jika tidak ada response atau user tidak terautentikasi
        if (!currentUser) {
          return redirect("/login");
        }
        
        // Validasi level pengguna
        switch (currentUser.level) {
          case "ADMIN":
            break;
          case "PETUGAS":
            // Redirect petugas ke halaman petugas
            return router.push("/kasir");
          default:
            // Redirect user selain ADMIN/PETUGAS
            return router.push("/login");
        }
        setIsAuth(false);
      } catch (error) {
        console.error("Authentication error:", error);
        // Redirect ke login jika terjadi error
        return router.push("/login");
      }
    };
    
    checkAuthentication();
    
    // Dependency array kosong berarti useEffect hanya dijalankan sekali saat komponen mount
  }, [router]);

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
      case "member":
        return <CustomerManagement />;
      case "transactions":
        return <TransactionManagement />;
      case "stock":
        return <StockManagement />;
      case "promotion":
        return <PromotionPage />;
      case "reports":
        return <ReportManagement />;
      case "analytics":
        return <AnalyticsPage />;
      default:
        return <UserManagement />;
    }
  };

  // Render loading state if authenticating
  if (isAuth) {
    return <NeoProgressIndicator isLoading={true} message="Checking authentication..." />;
  }

  // Main component render
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