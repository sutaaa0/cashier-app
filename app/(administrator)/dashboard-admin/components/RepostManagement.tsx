// app/components/ReportManagement.tsx

"use client";

import { useState } from "react";
import { BarChart, Download, Calendar, TrendingUp, Users } from "lucide-react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { generateReport, ReportData } from "@/server/actions";

export function ReportManagement() {
  const [reports, setReports] = useState<ReportData[]>([]);

  const handleGenerateReport = async () => {
    const types = ["sales", "inventory", "customers"];
    const newReports = await Promise.all(types.map((type) => generateReport(type)));
    setReports((prevReports) => [...newReports, ...prevReports]);
  };

  const handleDownload = (report: ReportData) => {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Convert data to worksheet format
    let wsData: any[] = [];

    switch (report.type) {
      case "sales":
        wsData = report.data.map((sale: any) => ({
          "Sale ID": sale.penjualanId,
          Date: new Date(sale.tanggalPenjualan).toLocaleDateString(),
          Total: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(sale.total_harga),
          Items: sale.detailPenjualan.length,
        }));
        break;

      case "inventory":
        wsData = report.data.map((product: any) => ({
          Product: product.nama,
          Price: product.harga,
          Stock: product.stok,
          Category: product.kategori,
        }));
        break;

      case "customers":
        wsData = report.data.map((customer: any) => ({
          Name: customer.nama,
          Points: customer.points,
          Phone: customer.nomorTelepon || "N/A",
          "Total Orders": customer.penjualan.length,
        }));
        break;
    }

    const ws = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, report.name);

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    // Download file
    saveAs(data, `${report.name}-${report.period}.xlsx`);
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case "sales":
        return <span>Rp</span>;
      case "inventory":
        return <TrendingUp size={24} />;
      case "customers":
        return <Users size={24} />;
      default:
        return <BarChart size={24} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">REPORTS & ANALYTICS</h2>
        <button
          onClick={handleGenerateReport}
          className="px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
        >
          <BarChart size={20} />
          Generate Report
        </button>
      </div>
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
                  onClick={() => handleDownload(report)}
                  className="p-2 bg-[#93B8F3] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
