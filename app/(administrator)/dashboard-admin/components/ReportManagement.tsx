"use client";
import { useState } from "react";
import { Calendar, TrendingUp,  PackageOpen, DollarSign } from "lucide-react";
import "jspdf-autotable";
import { generateProfitReport, ProfitReportData } from "@/server/actions";
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

// Menggunakan 3 periode terakhir untuk menghitung rata-rata tingkat pertumbuhan

// Period type for reports
type PeriodType = "weekly" | "monthly" | "yearly";


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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">LAPORAN & ANALISIS</h2>
      </div>

      {/* Profit Report Section */}
      <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-bold text-xl mb-4">Laporan Keuntungan</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label htmlFor="periodType" className="font-medium">
              Jenis Periode :
            </label>
            <select id="periodType" value={selectedPeriodType} onChange={(e) => setSelectedPeriodType(e.target.value as PeriodType)} className="border-[2px] border-black p-2">
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select>
          </div>

          <button
            onClick={handleGenerateProfitReport}
            className="px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
          >
            <DollarSign size={20} />
            Hasilkan Laporan Keuntungan
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm flex items-center">
            <span className="flex-shrink-0 text-blue-500 mr-2">💡</span>
            <span>
              <strong>Laporan Kinerja keuntungan</strong> memberikan analisis mendalam tentang tren keuntungan, margin, dan tingkat pertumbuhan Anda berdasarkan periode. Ideal untuk memahami profitabilitas bisnis Anda, mengidentifikasi
              kinerja tinggi dan rendah, dan memproyeksikan kinerja masa depan.
            </span>
          </p>
        </div>
      </div>

      {/* Product Performance Report Section */}
      <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-bold text-xl mb-4">Laporan Kinerja Produk</h3>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label htmlFor="productPeriodType" className="font-medium">
              Period:
            </label>
            <select id="productPeriodType" value={selectedProductPeriodType} onChange={(e) => setSelectedProductPeriodType(e.target.value as PeriodType)} className="border-[2px] border-black p-2">
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select>
          </div>

          <NeoLoadingButton onClick={handleGenerateProductReport} icon={<TrendingUp size={20} />} loadingText="Generating Report...">
            Hasilkan Laporan Produk
          </NeoLoadingButton>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm flex items-center">
            <span className="flex-shrink-0 text-blue-500 mr-2">💡</span>
            <span>
              <strong>Laporan Kinerja Produk</strong> menyediakan analisis komprehensif mengenai penjualan, margin keuntungan, dan pertumbuhan berdasarkan produk dan kategori. Ideal untuk mengevaluasi kinerja produk, mengidentifikasi produk
              unggulan, dan menemukan area yang perlu diperhatikan.
            </span>
          </p>
        </div>
      </div>

      {/* Inventory Stock Report Section */}
      <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-bold text-xl mb-4">Laporan Stok Persediaan</h3>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label htmlFor="inventoryPeriodType" className="font-medium">
              Periode:
            </label>
            <select id="inventoryPeriodType" value={selectedInventoryPeriodType} onChange={(e) => setSelectedInventoryPeriodType(e.target.value as PeriodType)} className="border-[2px] border-black p-2">
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select>
          </div>

          <button
            onClick={handleGenerateInventoryReport}
            className="px-4 py-2 bg-[#4DB6AC] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
          >
            <PackageOpen size={20} />
            Hasilkan Laporan Persediaan
          </button>
        </div>

        <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-md">
          <p className="text-sm flex items-center">
            <span className="flex-shrink-0 text-teal-500 mr-2">💡</span>
            <span>
              <strong>Laporan Stok Persediaan</strong> memberikan analisis terperinci tentang status inventaris Anda saat ini, menyoroti item yang perlu diperhatikan, titik pemesanan ulang yang optimal, dan distribusi nilai stok. Sempurna
              untuk manajemen inventaris dan mencegah kehabisan stok atau kelebihan stok.
            </span>
          </p>
        </div>
      </div>

      {/* Generated Profit Reports */}
      {profitReports.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold text-xl mb-4">Laporan Kinerja Keuntungan</h3>

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
                          Periode: {report.period}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm">
                        <span className="flex items-center">
                          <span className="font-medium">Penjualan:</span>{" "}
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                          }).format(report.totalAmount)}
                        </span>
                        <span className="flex items-center">
                          <span className="font-medium">Keuntungan:</span>{" "}
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
              
                </div>
              </div>

              {/* Interactive Dashboard for the latest report */}
              {index === 0 && (
                <div className="bg-white border-[3px] border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h3 className="font-bold text-xl mb-4">Dasbor Kinerja Keuntungan</h3>
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
          <h3 className="font-bold text-xl mb-4">Laporan Stok Persediaan</h3>

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
                          Periode: {report.period}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm">
                        <span className="flex items-center">
                          <span className="font-medium">Nilai Total:</span>{" "}
                          {new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                          }).format(report.totalStockValue)}
                        </span>
                        <span className="flex items-center">
                          <span className="font-medium">Produk:</span> {report.totalProducts.toLocaleString()}
                        </span>
                        <span className="flex items-center">
                          <span className="font-medium">Total Stok:</span> {report.totalStockCount}
                        </span>
                        {report.alerts.outOfStockCount > 0 && (
                          <span className="flex items-center text-red-600">
                            <span className="font-medium">Kehabisan Stok:</span> {report.alerts.outOfStockCount}
                          </span>
                        )}
                        {report.alerts.lowStockCount > 0 && (
                          <span className="flex items-center text-orange-600">
                            <span className="font-medium">Stok rendah:</span> {report.alerts.lowStockCount}
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
                  <h3 className="font-bold text-xl mb-4">Dashboard Stok Persediaan</h3>
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
          <h3 className="font-bold text-xl mb-4">Laporan Kinerja Produk</h3>

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
                          Periode: {report.period}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm">
                        <span className="flex items-center">
                          <span className="font-medium">Penjualan:</span>{" "}
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
                          <span className="font-medium">Produk yang Dijual:</span> {report.totalProductsSold.toLocaleString()}
                        </span>
                        <span className="flex items-center">
                          <span className="font-medium">Rata-rata Margin:</span> {report.avgProfitMargin.toFixed(1)}%
                        </span>
                        {report.productsWithNoSales.length > 0 && (
                          <span className="flex items-center text-red-600">
                            <span className="font-medium">Produk Tanpa Penjualan:</span> {report.productsWithNoSales.length}
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
                  <h3 className="font-bold text-xl mb-4">Dashboard Kinerja Produk</h3>
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
