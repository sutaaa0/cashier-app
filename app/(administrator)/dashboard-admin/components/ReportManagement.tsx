"use client";
import { useState } from "react";
import { Calendar, TrendingUp, FileText, FileDown, PackageOpen, DollarSign } from "lucide-react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { generateProfitReport, ProfitReportData } from "@/server/actions";
import { Penjualan, Pelanggan } from "@/types/types";
import { generateProductPerformanceReport, ProductPerformanceReportData } from "@/server/actions";
import ProductPerformanceDashboard from "./ProductPerformanceDashboard";
import { generateInventoryStockReport, InventoryReportData } from "@/server/actions";
import InventoryStockDashboard from "./InventoryStockDashboard";
import ProfitPerformanceDashboard from "./ProfitPerformanceDashboard";
import { NeoLoadingButton } from "@/components/NeoLoadingButton";

// Profit Margin (%) = (Profit / Total Sales) * 100
  // profit = total sales - total modal
  // pertumhuban = (penjualan saat ini - penjualan sebelumnya) / penjualan sebelumnya * 100
  // kontribusi = (total penjualan produk / total penjualan seluruh nya) * 100
  // sales velocity =(total terjual / jumlah hari)

  // penjualan tahunan = jumlah produk (periode ini ) * (365/30)

  // turnover rate tingkat perputaran = total jumlah produk terjual  tahunan / rata rata stok   

  // jumlah pesanan rekomendasi = level minimum - stok saat ini + penjualan 30 hari atau penjualan 30 hari terakhir + buffer 

  // Average Transaction value = total penjualan / total transaksi

  // profit per transaksi = total profit / total transaksi 

// Period type for reports
type PeriodType = "weekly" | "monthly" | "yearly";

interface Kategori {
  kategoriId: number;
  nama: string;
  icon: string;
  isDeleted: boolean;
}

interface Produk {
  produkId: number;
  nama: string;
  harga: number;
  hargaModal: number;
  stok: number;
  image: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  minimumStok: number;
  statusStok: string;
  kategoriId: number;
  kategori: Kategori;
}

// Menggunakan 3 periode terakhir untuk menghitung rata-rata tingkat pertumbuhan


export function ReportManagement() {
  const [profitReports, setProfitReports] = useState<ProfitReportData[]>([]);
  const [selectedPeriodType, setSelectedPeriodType] = useState<PeriodType>("monthly");
  // Product report states
  const [productReports, setProductReports] = useState<ProductPerformanceReportData[]>([]);
  const [selectedProductPeriodType, setSelectedProductPeriodType] = useState<PeriodType>("monthly");
  // Inventory report states
  const [inventoryReports, setInventoryReports] = useState<InventoryReportData[]>([]);
  const [selectedInventoryPeriodType, setSelectedInventoryPeriodType] = useState<PeriodType>("monthly");


  // Function handlers for product reports
  const handleGenerateProductReport = async () => {
    const newProductReport = await generateProductPerformanceReport(selectedProductPeriodType);
    setProductReports((prevReports) => [newProductReport, ...prevReports]);
  };

  // Function handler for inventory reports
  const handleGenerateInventoryReport = async () => {
    const newInventoryReport = await generateInventoryStockReport(selectedInventoryPeriodType);
    setInventoryReports((prevReports) => [newInventoryReport, ...prevReports]);
  };

  const handleGenerateProfitReport = async () => {
    const newProfitReport = await generateProfitReport(selectedPeriodType);
    setProfitReports((prevReports) => [newProfitReport, ...prevReports]);
  };

  // Handle Excel download for regular reports and profit reports only
  const handleDownloadExcel = (report: ProfitReportData) => {
    const wb = XLSX.utils.book_new();
    let wsData: Array<Record<string, string | number>> = [];

    // Handle either regular reports or profit reports
    if ("type" in report) {
      // Handle regular reports
      switch (report.type) {
        case "sales":
          wsData = (report.data as unknown as Penjualan[]).map((sale) => ({
            "Sale ID": sale.penjualanId,
            Date: new Date(sale.tanggalPenjualan).toLocaleDateString(),
            Total: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(sale.total_harga),
            Items: sale.detailPenjualan.length,
          }));
          break;

        case "inventory":
          wsData = (report.data as unknown as Produk[]).map((product) => ({
            Product: product.nama,
            Price: product.harga,
            Stock: product.stok,
            Category: product.kategori.nama,
          }));
          break;

        case "customers":
          wsData = (report.data as unknown as Pelanggan[]).map((customer) => ({
            Name: customer.nama,
            Points: customer.points,
            Phone: customer.nomorTelepon || "",
            "Total Orders": customer.penjualan.length,
          }));
          break;
      }
    } else if ("totalProfit" in report) {
      // Handle profit reports
      wsData = (report.data as { periodDate: string; totalSales: number; totalModal: number; profit: number; profitMargin: number; totalOrders: number }[]).map((item) => {
        const date = new Date(item.periodDate).toLocaleDateString();
        return {
          Period: date,
          "Total Sales": new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(item.totalSales),
          "Total Cost": new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(item.totalModal),
          Profit: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(item.profit),
          "Profit Margin": `${(item.profitMargin * 100).toFixed(2)}%`,
          Orders: item.totalOrders,
        };
      });
    }

    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, report.name);

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    saveAs(data, `${report.name}-${report.period}.xlsx`);
  };

  // Handle PDF download for regular reports and profit reports only
  const handleDownloadPDF = (report: ProfitReportData) => {
    const doc = new jsPDF();

    // Add title and period
    doc.setFontSize(18);
    doc.text(report.name, 14, 22);

    doc.setFontSize(12);
    doc.text(`Period: ${report.period}`, 14, 30);
    doc.text(`Created: ${new Date(report.generatedDate).toLocaleString()}`, 14, 38);

    // Prepare table data
    let tableData: (string | number)[][] = [];
    let tableColumns: { header: string; dataKey: string }[] = [];

    if ("type" in report) {
      // Handle regular reports
      switch (report.type) {
        case "sales":
          tableColumns = [
            { header: "Sale ID", dataKey: "id" },
            { header: "Date", dataKey: "date" },
            { header: "Total", dataKey: "total" },
            { header: "Items", dataKey: "items" },
          ];
          tableData = (report.data as unknown as Penjualan[]).map((sale) => [
            sale.penjualanId,
            new Date(sale.tanggalPenjualan).toLocaleDateString(),
            new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(sale.total_harga),
            sale.detailPenjualan.length,
          ]);
          break;

        case "inventory":
          tableColumns = [
            { header: "Product", dataKey: "product" },
            { header: "Price", dataKey: "price" },
            { header: "Stock", dataKey: "stock" },
            { header: "Category", dataKey: "category" },
          ];
          tableData = (report.data as unknown as Produk[]).map((product) => [product.nama, product.harga, product.stok, product.kategori.nama || "N/A"]);
          break;

        case "customers":
          tableColumns = [
            { header: "Name", dataKey: "name" },
            { header: "Points", dataKey: "points" },
            { header: "Phone", dataKey: "phone" },
            { header: "Orders", dataKey: "orders" },
          ];
          tableData = (report.data as unknown as Pelanggan[]).map((customer) => [customer.nama, customer.points, customer.nomorTelepon || "N/A", customer.penjualan.length]);
          break;
      }
    } else if ("totalProfit" in report) {
      // Handle profit reports
      tableColumns = [
        { header: "Period", dataKey: "period" },
        { header: "Total Sales", dataKey: "sales" },
        { header: "Total Cost", dataKey: "cost" },
        { header: "Profit", dataKey: "profit" },
        { header: "Profit Margin", dataKey: "margin" },
        { header: "Orders", dataKey: "orders" },
      ];

      tableData = report.data.map((item) => [
        new Date(item.periodDate).toLocaleDateString(),
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(item.totalSales),
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(item.totalModal),
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(item.profit),
        `${(item.profitMargin * 100).toFixed(2)}%`,
        item.totalOrders,
      ]);
    }

    // Standard report content
    doc.autoTable({
      startY: 47,
      head: [tableColumns.map((col) => col.header)],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [147, 184, 243] },
    });

    doc.save(`${report.name}-${report.period}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">REPORTS & ANALYTICS</h2>
      </div>

      {/* Profit Report Section */}
      <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-bold text-xl mb-4">Profit Reports</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label htmlFor="periodType" className="font-medium">
              Period Type:
            </label>
            <select id="periodType" value={selectedPeriodType} onChange={(e) => setSelectedPeriodType(e.target.value as PeriodType)} className="border-[2px] border-black p-2">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <button
            onClick={handleGenerateProfitReport}
            className="px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
          >
            <DollarSign size={20} />
            Generate Profit Report
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm flex items-center">
            <span className="flex-shrink-0 text-blue-500 mr-2">💡</span>
            <span>
              <strong>Profit Performance Report</strong> provides in-depth analysis of your profit trends, margins, and growth rates by period. Ideal for understanding your business profitability, identifying high and low performing
              periods, and projecting future performance.
            </span>
          </p>
        </div>
      </div>

      {/* Product Performance Report Section */}
      <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-bold text-xl mb-4">Product Performance Report</h3>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label htmlFor="productPeriodType" className="font-medium">
              Period:
            </label>
            <select id="productPeriodType" value={selectedProductPeriodType} onChange={(e) => setSelectedProductPeriodType(e.target.value as PeriodType)} className="border-[2px] border-black p-2">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <NeoLoadingButton onClick={handleGenerateProductReport} icon={<TrendingUp size={20} />} loadingText="Generating Report...">
            Generate Product Report
          </NeoLoadingButton>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm flex items-center">
            <span className="flex-shrink-0 text-blue-500 mr-2">💡</span>
            <span>
              <strong>Product Performance Report</strong> provides comprehensive analysis of sales, profit margins, and growth by product and category. Ideal for evaluating product performance, identifying top products, and finding areas
              that need attention.
            </span>
          </p>
        </div>
      </div>

      {/* Inventory Stock Report Section */}
      <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-bold text-xl mb-4">Inventory Stock Report</h3>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label htmlFor="inventoryPeriodType" className="font-medium">
              Period:
            </label>
            <select id="inventoryPeriodType" value={selectedInventoryPeriodType} onChange={(e) => setSelectedInventoryPeriodType(e.target.value as PeriodType)} className="border-[2px] border-black p-2">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <button
            onClick={handleGenerateInventoryReport}
            className="px-4 py-2 bg-[#4DB6AC] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
          >
            <PackageOpen size={20} />
            Generate Inventory Report
          </button>
        </div>

        <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-md">
          <p className="text-sm flex items-center">
            <span className="flex-shrink-0 text-teal-500 mr-2">💡</span>
            <span>
              <strong>Inventory Stock Report</strong> provides detailed analysis of your current inventory status, highlighting items that need attention, optimal reorder points, and stock value distribution. Perfect for inventory
              management and preventing stockouts or excess inventory.
            </span>
          </p>
        </div>
      </div>

      {/* Generated Profit Reports */}
      {profitReports.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold text-xl mb-4">Profit Performance Reports</h3>

          {profitReports.map((report, index) => (
            <div key={`profit-${index}`} className="mb-6">
              <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#FFE66D] border-[3px] border-black">
                      <DollarSign size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{report.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center text-sm">
                          <Calendar size={16} className="mr-1" />
                          Period: {report.period}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm">
                        <span className="flex items-center">
                          <span className="font-medium">Sales:</span>{" "}
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                          }).format(report.totalAmount)}
                        </span>
                        <span className="flex items-center">
                          <span className="font-medium">Profit:</span>{" "}
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                          }).format(report.totalProfit)}
                        </span>
                        <span className="flex items-center">
                          <span className="font-medium">Margin:</span> {(report.profitMargin * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadExcel(report)}
                      className="p-2 bg-[#FFE66D] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                      title="Download Excel"
                    >
                      <FileText size={20} />
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(report)}
                      className="p-2 bg-[#FF6B6B] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all text-white"
                      title="Download PDF"
                    >
                      <FileDown size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Dashboard for the latest report */}
              {index === 0 && (
                <div className="bg-white border-[3px] border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="font-bold text-xl mb-4">Profit Performance Dashboard</h3>
                  <ProfitPerformanceDashboard report={report} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Generated Inventory Reports */}
      {inventoryReports.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold text-xl mb-4">Inventory Stock Reports</h3>

          {inventoryReports.map((report, index) => (
            <div key={`inventory-${index}`} className="mb-6">
              <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#4DB6AC] border-[3px] border-black">
                      <PackageOpen size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{report.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center text-sm">
                          <Calendar size={16} className="mr-1" />
                          Period: {report.period}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm">
                        <span className="flex items-center">
                          <span className="font-medium">Total Value:</span>{" "}
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                          }).format(report.totalStockValue)}
                        </span>
                        <span className="flex items-center">
                          <span className="font-medium">Products:</span> {report.totalProducts.toLocaleString()}
                        </span>
                        <span className="flex items-center">
                          <span className="font-medium">Total Stock:</span> {report.totalStockCount}
                        </span>
                        {report.alerts.outOfStockCount > 0 && (
                          <span className="flex items-center text-red-600">
                            <span className="font-medium">Out of Stock:</span> {report.alerts.outOfStockCount}
                          </span>
                        )}
                        {report.alerts.lowStockCount > 0 && (
                          <span className="flex items-center text-orange-600">
                            <span className="font-medium">Low Stock:</span> {report.alerts.lowStockCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Dashboard Visualization for the latest report */}
              {index === 0 && (
                <div className="bg-white border-[3px] border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="font-bold text-xl mb-4">Inventory Stock Dashboard</h3>
                  <InventoryStockDashboard report={report} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Generated Product Reports */}
      {productReports.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold text-xl mb-4">Product Performance Reports</h3>

          {productReports.map((report, index) => (
            <div key={`product-${index}`} className="mb-6">
              <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#93B8F3] border-[3px] border-black">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{report.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center text-sm">
                          <Calendar size={16} className="mr-1" />
                          Period: {report.period}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm">
                        <span className="flex items-center">
                          <span className="font-medium">Sales:</span>{" "}
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                          }).format(report.totalSales)}
                          {report.salesGrowth !== null && report.salesGrowth !== undefined && (
                            <span className={`ml-1 ${report.salesGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {report.salesGrowth >= 0 ? "↑" : "↓"} {Math.abs(report.salesGrowth).toFixed(1)}%
                            </span>
                          )}
                        </span>
                        <span className="flex items-center">
                          <span className="font-medium">Products Sold:</span> {report.totalProductsSold.toLocaleString()}
                        </span>
                        <span className="flex items-center">
                          <span className="font-medium">Avg. Margin:</span> {report.avgProfitMargin.toFixed(1)}%
                        </span>
                        {report.productsWithNoSales.length > 0 && (
                          <span className="flex items-center text-red-600">
                            <span className="font-medium">Products Without Sales:</span> {report.productsWithNoSales.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Dashboard for the latest report */}
              {index === 0 && (
                <div className="bg-white border-[3px] border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="font-bold text-xl mb-4">Product Performance Dashboard</h3>
                  <ProductPerformanceDashboard report={report} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
