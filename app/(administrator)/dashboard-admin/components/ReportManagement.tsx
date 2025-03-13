"use client";
import { useState } from "react";
import { BarChart, Download, Calendar, TrendingUp, Users, FileText, FileDown } from "lucide-react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { generateReport, generateProfitReport, ReportData, ProfitReportData } from "@/server/actions";
import { Penjualan, Produk, Pelanggan } from "@/types/types";

// Period type for profit reports
type PeriodType = "weekly" | "monthly" | "yearly";

export function ReportManagement() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [profitReports, setProfitReports] = useState<ProfitReportData[]>([]);
  const [selectedPeriodType, setSelectedPeriodType] = useState<PeriodType>("monthly");

  const handleGenerateReport = async () => {
    const types = ["sales", "inventory", "customers"];
    const newReports = await Promise.all(types.map((type) => generateReport(type)));
    setReports((prevReports) => [...newReports, ...prevReports]);
  };

  const handleGenerateProfitReport = async () => {
    const newProfitReport = await generateProfitReport(selectedPeriodType);
    setProfitReports((prevReports) => [newProfitReport, ...prevReports]);
  };

  const handleDownloadExcel = (report: ReportData | ProfitReportData) => {
    const wb = XLSX.utils.book_new();
    let wsData: Array<Record<string, string | number>> = [];

    if ('type' in report) {
      // Handle regular reports
      switch (report.type) {
        case "sales":
          wsData = ((report.data as unknown) as Penjualan[]).map((sale) => ({
            "Sale ID": sale.penjualanId,
            Date: new Date(sale.tanggalPenjualan).toLocaleDateString(),
            Total: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(sale.total_harga),
            Items: sale.detailPenjualan.length,
          }));
          break;
  
        case "inventory":
          wsData = ((report.data as unknown) as Produk[]).map((product) => ({
            Product: product.nama,
            Price: product.harga,
            Stock: product.stok,
            Category: product.kategori,
          }));
          break;
  
        case "customers":
          wsData = ((report.data as unknown) as Pelanggan[]).map((customer) => ({
            Name: customer.nama,
            Points: customer.points,
            Phone: customer.nomorTelepon || "N/A",
            "Total Orders": customer.penjualan.length,
          }));
          break;
      }
    } else {
      // Handle profit reports
      wsData = (report.data as any[]).map((item) => {
        const date = new Date(item.periodDate).toLocaleDateString();
        return {
          "Period": date,
          "Total Sales": new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(item.totalSales),
          "Total Cost": new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(item.totalModal),
          "Profit": new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(item.profit),
          "Profit Margin": `${(item.profitMargin * 100).toFixed(2)}%`,
          "Orders": item.totalOrders
        };
      });
    }

    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, report.name);

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    saveAs(data, `${report.name}-${report.period}.xlsx`);
  };

  const handleDownloadPDF = (report: ReportData | ProfitReportData) => {
    const doc = new jsPDF();
    
    // Add title and period
    doc.setFontSize(18);
    doc.text(report.name, 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Period: ${report.period}`, 14, 30);
    doc.text(`Generated: ${new Date(report.generatedDate).toLocaleString()}`, 14, 38);
    
    // Add summary if available
    if ('summary' in report) {
      doc.text(`Summary: ${report.summary}`, 14, 46);
    }
    
    // Prepare table data
    let tableData: any[] = [];
    let tableColumns: any[] = [];
    
    if ('type' in report) {
      // Handle regular reports
      switch (report.type) {
        case "sales":
          tableColumns = [
            { header: 'Sale ID', dataKey: 'id' },
            { header: 'Date', dataKey: 'date' },
            { header: 'Total', dataKey: 'total' },
            { header: 'Items', dataKey: 'items' }
          ];
          tableData = ((report.data as unknown) as Penjualan[]).map((sale) => [
            sale.penjualanId,
            new Date(sale.tanggalPenjualan).toLocaleDateString(),
            new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(sale.total_harga),
            sale.detailPenjualan.length,
          ]);
          break;
  
        case "inventory":
          tableColumns = [
            { header: 'Product', dataKey: 'product' },
            { header: 'Price', dataKey: 'price' },
            { header: 'Stock', dataKey: 'stock' },
            { header: 'Category', dataKey: 'category' }
          ];
          tableData = ((report.data as unknown) as Produk[]).map((product) => [
            product.nama,
            product.harga,
            product.stok,
            product.kategori,
          ]);
          break;
  
        case "customers":
          tableColumns = [
            { header: 'Name', dataKey: 'name' },
            { header: 'Points', dataKey: 'points' },
            { header: 'Phone', dataKey: 'phone' },
            { header: 'Orders', dataKey: 'orders' }
          ];
          tableData = ((report.data as unknown) as Pelanggan[]).map((customer) => [
            customer.nama,
            customer.points,
            customer.nomorTelepon || "N/A",
            customer.penjualan.length,
          ]);
          break;
      }
    } else {
      // Handle profit reports
      tableColumns = [
        { header: 'Period', dataKey: 'period' },
        { header: 'Total Sales', dataKey: 'sales' },
        { header: 'Total Cost', dataKey: 'cost' },
        { header: 'Profit', dataKey: 'profit' },
        { header: 'Profit Margin', dataKey: 'margin' },
        { header: 'Orders', dataKey: 'orders' }
      ];
      
      tableData = (report.data as any[]).map((item) => [
        new Date(item.periodDate).toLocaleDateString(),
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(item.totalSales),
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(item.totalModal),
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(item.profit),
        `${(item.profitMargin * 100).toFixed(2)}%`,
        item.totalOrders
      ]);
    }
    
    // @ts-ignore: jspdf-autotable types
    doc.autoTable({
      startY: 'summary' in report ? 55 : 47,
      head: [tableColumns.map(col => col.header)],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [147, 184, 243] }
    });
    
    doc.save(`${report.name}-${report.period}.pdf`);
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case "sales":
        return <span>Rp</span>;
      case "inventory":
        return <TrendingUp size={24} />;
      case "customers":
        return <Users size={24} />;
      case "profit":
        return <span className="font-bold">%</span>;
      default:
        return <BarChart size={24} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">REPORTS & ANALYTICS</h2>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateReport}
            className="px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
          >
            <BarChart size={20} />
            Generate Report
          </button>
        </div>
      </div>

      {/* Profit Report Section */}
      <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-bold text-xl mb-4">Profit Reports</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label htmlFor="periodType" className="font-medium">Period Type:</label>
            <select
              id="periodType"
              value={selectedPeriodType}
              onChange={(e) => setSelectedPeriodType(e.target.value as PeriodType)}
              className="border-[2px] border-black p-2"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <button
            onClick={handleGenerateProfitReport}
            className="px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
          >
            <BarChart size={20} />
            Generate Profit Report
          </button>
        </div>
      </div>

      {/* Generated Profit Reports */}
      {profitReports.length > 0 && (
        <div className="grid gap-4 mt-6">
          <h3 className="font-bold text-xl">Profit Reports</h3>
          {profitReports.map((report, index) => (
            <div key={`profit-${index}`} className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-[#93B8F3] border-[3px] border-black">{getReportIcon("profit")}</div>
                  <div>
                    <h3 className="font-bold text-lg">{report.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center text-sm">
                        <Calendar size={16} className="mr-1" />
                        Period: {report.period}
                      </span>
                    </div>
                    <p className="text-sm mt-1">
                      Total Sales: {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR"
                      }).format(report.totalAmount)} | 
                      Profit: {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR"
                      }).format(report.totalProfit)} |
                      Margin: {(report.profitMargin * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadExcel(report)}
                    className="p-2 bg-[#93B8F3] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                    title="Download Excel"
                  >
                    <FileText size={20} />
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(report)}
                    className="p-2 bg-[#93B8F3] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                    title="Download PDF"
                  >
                    <FileDown size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Regular Reports Section */}
      <div className="grid gap-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#93B8F3] border-[3px] border-black">{getReportIcon(report.type)}</div>
                <div>
                  <h3 className="font-bold text-lg">{report.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center text-sm">
                      <Calendar size={16} className="mr-1" />
                      Period: {report.period}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{report.summary}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadExcel(report)}
                  className="p-2 bg-[#93B8F3] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                  title="Download Excel"
                >
                  <FileText size={20} />
                </button>
                <button
                  onClick={() => handleDownloadPDF(report)}
                  className="p-2 bg-[#93B8F3] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                  title="Download PDF"
                >
                  <FileDown size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}