import React, { useState, useEffect } from "react";
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, Area, LineChart, ReferenceLine } from "recharts";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { FileText, FileDown, Sparkles, TrendingUp, DollarSign, Percent, TrendingDown } from "lucide-react";
import { formatRupiah } from "@/lib/formatIdr";

// Vibrant neo-brutalist color palette
const TOTAL_SALES_COLOR = "#4ECDC4";
const TOTAL_COST_COLOR = "#FF8364";
const PROFIT_COLOR = "#FFE66D";
const PROFIT_MARGIN_COLOR = "#45B7D1";

// Helper function to calculate growth rate between periods
interface CalculateGrowthFn {
  (current: number, previous: number): number | null;
}

const calculateGrowth: CalculateGrowthFn = (current, previous) => {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
};

// Helper function to format date strings
interface ILocaleDateOptions extends Intl.DateTimeFormatOptions {
  day: "numeric";
  month: "short";
  year: "numeric";
}

interface IFormatDateString {
  (dateString: string): string;
}

const formatDateString: IFormatDateString = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" } as ILocaleDateOptions);
};

// Custom tooltip for line/bar charts
interface CustomTooltipPayload {
  color: string;
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayload[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        <div className="relative bg-white border-4 border-black p-4 transform -rotate-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="text-blue-500" size={20} />
            <h3 className="font-black text-xl">{label}</h3>
          </div>

          {payload.map((entry, index) => {
            // Determine optimal text color based on background color
            const isGrowthValue = entry.name.toLowerCase().includes("growth");
            const isLightBackground = entry.color === "#ffffff" || entry.color === "#fff" || entry.color === "white";
            const textColor = isLightBackground ? "black" : "white";

            return (
              <div key={index} className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-4 h-4 border-2 border-black"
                    style={{
                      backgroundColor: isGrowthValue && entry.value >= 0 ? "#2ecc71" : isGrowthValue && entry.value < 0 ? "#e74c3c" : entry.color,
                    }}
                  />
                  <span className="font-bold">{entry.name}:</span>
                </div>
                <div
                  className="font-mono p-2 transform rotate-1 border-2 border-black"
                  style={{
                    backgroundColor: isGrowthValue && entry.value >= 0 ? "#2ecc71" : isGrowthValue && entry.value < 0 ? "#e74c3c" : entry.color,
                    color: textColor,
                  }}
                >
                  {entry.name.toLowerCase().includes("margin") || entry.name.toLowerCase().includes("growth") ? `${entry.value.toFixed(2)}%` : formatRupiah(entry.value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

// Custom growth indicator component
interface GrowthIndicatorProps {
  value: number;
  prefix?: string;
  size?: "sm" | "md" | "lg";
}

const GrowthIndicator: React.FC<GrowthIndicatorProps> = ({ value, prefix = "", size = "md" }) => {
  if (value === null || value === undefined) return null;

  const sizeClasses = {
    sm: "text-sm",
    md: "text-md",
    lg: "text-lg",
  };

  return (
    <span className={`flex items-center gap-1 font-bold ${value >= 0 ? "text-green-600" : "text-red-600"} ${sizeClasses[size]}`}>
      {value >= 0 ? <TrendingUp size={size === "sm" ? 14 : size === "md" ? 18 : 22} /> : <TrendingDown size={size === "sm" ? 14 : size === "md" ? 18 : 22} />}
      {prefix}
      {Math.abs(value).toFixed(2)}%
    </span>
  );
};

// TypeScript interfaces
interface PeriodData {
  totalSales: number;
  totalModal: number;
  profit: number;
  profitMargin: number;
  totalOrders: number;
  periodDate: string;
  periodLabel: string;
  salesGrowth?: number | null;
  costGrowth?: number | null;
  marginGrowth?: number | null;
}

interface ReportData {
  id: number;
  name: string;
  period: string;
  periodType: string;
  generatedDate: string;
  totalAmount: number;
  totalProfit: number;
  profitMargin: number;
  data: PeriodData[];
}

interface MonthlyProfitReportProps {
  report: ReportData;
}

const ProfitPerformanceDashboard: React.FC<MonthlyProfitReportProps> = ({ report }) => {
  console.log("data yang diterima :", report);
  const [activeTab, setActiveTab] = useState("overview");
  const [positions, setPositions] = useState<{ left: string; top: string }[]>([]);
  const [projectedData, setProjectedData] = useState<
    {
      periodDate: string;
      periodLabel: string;
      totalSales: number;
      totalModal: number;
      profit: number;
      profitMargin: number;
      isProjected: boolean;
    }[]
  >([]);

  // Find highest and lowest profit periods
  const highestProfitPeriod = [...report.data].sort((a, b) => b.profit - a.profit)[0] || {};
  const lowestProfitPeriod = [...report.data].sort((a, b) => a.profit - b.profit)[0] || {};

  // Generate random positions for decorative elements
  useEffect(() => {
    setPositions(
      [...Array(20)].map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }))
    );

    // Generate projected data based on historical trend
    if (report.data.length >= 3) {
      const lastThreePeriods = report.data.slice(-3);

      // Calculate average growth rate
      const growthRates = [];
      for (let i = 1; i < lastThreePeriods.length; i++) {
        const growth = calculateGrowth(lastThreePeriods[i].profit, lastThreePeriods[i - 1].profit);
        if (growth !== null) growthRates.push(growth / 100); // Convert to decimal
      }

      const avgGrowthRate = growthRates.length ? growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length : 0.05; // Default to 5% if we can't calculate

      // Get last period data
      const lastPeriod = lastThreePeriods[lastThreePeriods.length - 1];

      // Project next three periods
      const projected = [];
      let lastProjectedProfit = lastPeriod.profit;
      let lastProjectedSales = lastPeriod.totalSales;

      for (let i = 1; i <= 3; i++) {
        // Project with some slight randomness for natural-looking growth
        const randomFactor = 0.9 + Math.random() * 0.2; // 0.9-1.1 randomness factor
        const projectedProfit = lastProjectedProfit * (1 + avgGrowthRate * randomFactor);
        const projectedSales = lastProjectedSales * (1 + avgGrowthRate * randomFactor * 0.8); // Sales grow slower than profit
        const projectedCost = projectedSales - projectedProfit;

        // Estimate date for next period based on last two periods
        let nextPeriodDate;
        if (report.periodType === "monthly") {
          const lastDate = new Date(lastPeriod.periodDate);
          nextPeriodDate = new Date(lastDate.setMonth(lastDate.getMonth() + i));
        } else if (report.periodType === "weekly") {
          const lastDate = new Date(lastPeriod.periodDate);
          nextPeriodDate = new Date(lastDate.setDate(lastDate.getDate() + i * 7));
        } else {
          // yearly
          const lastDate = new Date(lastPeriod.periodDate);
          nextPeriodDate = new Date(lastDate.setFullYear(lastDate.getFullYear() + i));
        }

        projected.push({
          periodDate: nextPeriodDate.toISOString(),
          periodLabel: `${
            report.periodType === "monthly"
              ? nextPeriodDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
              : report.periodType === "weekly"
              ? `Week ${Math.ceil(nextPeriodDate.getDate() / 7)}, ${nextPeriodDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`
              : nextPeriodDate.getFullYear().toString()
          } (Projected)`,
          totalSales: projectedSales,
          totalModal: projectedCost,
          profit: projectedProfit,
          profitMargin: (projectedProfit / projectedSales) * 100,
          isProjected: true,
        });

        // Update for next projection
        lastProjectedProfit = projectedProfit;
        lastProjectedSales = projectedSales;
      }

      setProjectedData(projected);
    }
  }, [report.data, report.periodType]);

  // Prepare data for charts with proper formatting
  const chartData = [...report.data].map((period) => ({
    ...period,
    periodLabel: period.periodLabel,
    formattedDate: formatDateString(period.periodDate),
  }));

  // Include projected data in trend chart
  const trendChartData = [
    ...chartData,
    ...projectedData.map((period) => ({
      ...period,
      formattedDate: formatDateString(period.periodDate),
    })),
  ];

  // Calculate Period-over-Period growth rates
  const popGrowthData = chartData.map((period, index, array) => {
    if (index === 0) return { ...period, popGrowth: null };

    const prevPeriod = array[index - 1];
    const popGrowth = calculateGrowth(period.profit, prevPeriod.profit);

    return {
      ...period,
      popGrowth,
      salesGrowth: calculateGrowth(period.totalSales, prevPeriod.totalSales),
      costGrowth: calculateGrowth(period.totalModal, prevPeriod.totalModal),
      marginGrowth: calculateGrowth(period.profitMargin, prevPeriod.profitMargin),
    };
  });

  // Find periods with significant performance changes
  const significantChanges = popGrowthData
    .filter((period) => period.popGrowth !== null && Math.abs(period.popGrowth) > 10) // 10% threshold
    .sort((a, b) => Math.abs(b.popGrowth as number) - Math.abs(a.popGrowth as number))
    .slice(0, 3) // Top 3 most significant changes
    .map((period) => ({
      ...period,
      changeType: (period.popGrowth as number) > 0 ? "positive" : "negative",
    }));

  // Calculate average profit margin across all periods
  interface IProfitPeriod {
    profitMargin: number;
  }

  const avgProfitMargin: number = report.data.reduce((sum: number, period: IProfitPeriod) => sum + period.profitMargin, 0) / (report.data.length || 1);

  // Calculate overall profit growth (first period to last period)
  const overallGrowth = report.data.length >= 2 ? calculateGrowth(report.data[report.data.length - 1].profit, report.data[0].profit) : null;

  // Handle Excel download function
  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();

    // Create Profit Summary sheet
    const summaryData = [
      {
        "Nama Laporan": report.name,
        Periode: report.period,
        "Tanggal Dibuat": new Date(report.generatedDate).toLocaleString(),
        "Total Penjualan": formatRupiah(report.totalAmount),
        "Total Biaya": formatRupiah(report.totalAmount - report.totalProfit),
        "Total Keuntungan": formatRupiah(report.totalProfit),
        "Rata-rata Margin Keuntungan": `${(report.profitMargin * 100).toFixed(2)}%`,
        "Pertumbuhan Keseluruhan": overallGrowth ? `${overallGrowth.toFixed(2)}%` : "0%",
        "Periode Keuntungan Tertinggi": highestProfitPeriod.periodLabel || "0%",
        "Jumlah Keuntungan Tertinggi": formatRupiah(highestProfitPeriod.profit || 0),
        "Periode Keuntungan Terendah": lowestProfitPeriod.periodLabel || "0%",
        "Jumlah Keuntungan Terendah": formatRupiah(lowestProfitPeriod.profit || 0),
      },
    ];

    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");

    // Create detailed profit data sheet
    interface IReportPeriod {
      periodLabel: string;
      totalSales: number;
      totalModal: number;
      profit: number;
      profitMargin: number;
      totalOrders: number;
      popGrowth?: number | null;
    }

    interface DataEntriRinci {
      Periode: string;
      "Total Penjualan": string;
      "Total Biaya": string;
      Keuntungan: string;
      "Margin Keuntungan": string;
      Pesanan: number;
      "Pertumbuhan (vs Sebelumnya)": string;
    }

    const dataRinci: DataEntriRinci[] = report.data.map((period: IReportPeriod) => ({
      Periode: period.periodLabel,
      "Total Penjualan": formatRupiah(period.totalSales),
      "Total Biaya": formatRupiah(period.totalModal),
      Keuntungan: formatRupiah(period.profit),
      "Margin Keuntungan": `${period.profitMargin.toFixed(2)}%`,
      Pesanan: period.totalOrders,
      "Pertumbuhan (vs Sebelumnya)": period.popGrowth ? `${period.popGrowth.toFixed(2)}%` : "0%",
    }));

    const ws2 = XLSX.utils.json_to_sheet(dataRinci);
    XLSX.utils.book_append_sheet(wb, ws2, "Data Keuntungan Rinci");

    // Membuat sheet proyeksi jika tersedia
    if (projectedData.length > 0) {
      const dataProyeksi = projectedData.map((period) => ({
        Periode: period.periodLabel,
        "Proyeksi Penjualan": formatRupiah(period.totalSales),
        "Proyeksi Biaya": formatRupiah(period.totalModal),
        "Proyeksi Keuntungan": formatRupiah(period.profit),
        "Proyeksi Margin": `${period.profitMargin.toFixed(2)}%`,
        Berdasarkan: "Analisis tren historis",
      }));

      const ws3 = XLSX.utils.json_to_sheet(dataProyeksi);
      XLSX.utils.book_append_sheet(wb, ws3, "Proyeksi");
    }

    // Membuat sheet perubahan signifikan jika tersedia
    if (significantChanges.length > 0) {
      const dataPerubahan = significantChanges.map((period) => ({
        Periode: period.periodLabel,
        "Jenis Perubahan": period.changeType === "positive" ? "Peningkatan" : "Penurunan",
        "Perubahan Keuntungan": `${period.popGrowth?.toFixed(2)}%`,
        "Perubahan Penjualan": `${period.salesGrowth ? period.salesGrowth.toFixed(2) : "0"}%`,
        "Perubahan Biaya": `${period.costGrowth ? period.costGrowth.toFixed(2) : "0"}%`,
        "Perubahan Margin": `${period.marginGrowth ? period.marginGrowth.toFixed(2) : "0"}%`,
        "Total Penjualan": formatRupiah(period.totalSales),
        "Total Biaya": formatRupiah(period.totalModal),
        Keuntungan: formatRupiah(period.profit),
      }));

      const ws4 = XLSX.utils.json_to_sheet(dataPerubahan);
      XLSX.utils.book_append_sheet(wb, ws4, "Perubahan Signifikan");
    }

    // Write the file
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    saveAs(data, `${report.name}-${report.period}.xlsx`);
  };

  // Handle PDF download function
  const handleDownloadPDF = () => {
    const doc = new jsPDF("landscape");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    // Header dengan ukuran font lebih kecil
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(report.name, margin, 15);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Periode: ${report.period}`, margin, 22);
    doc.text(`Dibuat: ${new Date(report.generatedDate).toLocaleString()}`, margin, 27);

    // Garis pemisah
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, 30, pageWidth - margin, 30);

    // Mulai tabel keuntungan
    const startY = 35;

    // Persiapkan kolom
    const profitTableColumns = [
      { header: "Periode", dataKey: "period", width: 45 },
      { header: "Total Penjualan", dataKey: "sales", width: 35 },
      { header: "Total Biaya", dataKey: "cost", width: 35 },
      { header: "Keuntungan", dataKey: "profit", width: 35 },
      { header: "Margin", dataKey: "margin", width: 25 },
      { header: "Pesanan", dataKey: "orders", width: 20 },
      { header: "Pertumbuhan", dataKey: "growth", width: 25 },
    ];

    // Persiapkan data
    const profitData = popGrowthData.map((period) => {
      return [
        period.periodLabel,
        formatRupiah(period.totalSales),
        formatRupiah(period.totalModal),
        formatRupiah(period.profit),
        `${period.profitMargin.toFixed(2)}%`,
        period.totalOrders,
        period.popGrowth ? `${period.popGrowth.toFixed(2)}%` : "0%",
      ];
    });

    doc.autoTable({
      startY,
      head: [profitTableColumns.map((col) => col.header)],
      body: profitData,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
      },
      styles: {
        font: "helvetica",
        fontSize: 7,
        overflow: "linebreak",
        cellPadding: 2,
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { halign: "left", cellWidth: profitTableColumns[0].width },
        1: { halign: "right", cellWidth: profitTableColumns[1].width },
        2: { halign: "right", cellWidth: profitTableColumns[2].width },
        3: { halign: "right", cellWidth: profitTableColumns[3].width },
        4: { halign: "right", cellWidth: profitTableColumns[4].width },
        5: { halign: "right", cellWidth: profitTableColumns[5].width },
        6: { halign: "right", cellWidth: profitTableColumns[6].width },
      },
      didParseCell: (data) => {
        // Sorot periode keuntungan tertinggi dan terendah
        const periodData = data.row.raw;
        if (periodData && Array.isArray(periodData)) {
          // Label periode ada di indeks 0, keuntungan di indeks 3
          if (periodData[0] === highestProfitPeriod.periodLabel) {
            data.cell.styles.fillColor = [230, 255, 230]; // Hijau muda
          } else if (periodData[0] === lowestProfitPeriod.periodLabel) {
            data.cell.styles.fillColor = [255, 235, 235]; // Merah muda
          }

          // Sorot sel pertumbuhan berdasarkan nilai positif/negatif
          if (data.column.index === 6 && periodData[6] !== "0%" && periodData[6] != null) {
            const growthValue = parseFloat(String(periodData[6]));
            if (growthValue > 0) {
              data.cell.styles.textColor = [0, 150, 0]; // Hijau untuk positif
            } else if (growthValue < 0) {
              data.cell.styles.textColor = [200, 0, 0]; // Merah untuk negatif
            }
          }
        }
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
      margin: { left: margin, right: margin },
    });

    // Tambahkan bagian ringkasan
    let footerY = (doc.lastAutoTable?.finalY ?? startY) + 10;

    // Periksa apakah halaman baru diperlukan untuk ringkasan
    if (footerY > pageHeight - 40) {
      doc.addPage("landscape");
      footerY = 15;
    }

    // Bagian ringkasan
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan Laporan Keuntungan", margin, footerY);

    footerY += 6;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    // Poin-poin ringkasan dalam format ringkas
    const summaryPoints = [
      `• Total Penjualan: ${formatRupiah(report.totalAmount)}`,
      `• Total Biaya: ${formatRupiah(report.totalAmount - report.totalProfit)}`,
      `• Total Keuntungan: ${formatRupiah(report.totalProfit)}`,
      `• Rata-rata Margin: ${(report.profitMargin * 100).toFixed(2)}%`,
      `• Pertumbuhan Keseluruhan: ${overallGrowth ? `${overallGrowth.toFixed(2)}%` : "0%"}`,
      `• Keuntungan Tertinggi: ${highestProfitPeriod.periodLabel || "0%"} (${formatRupiah(highestProfitPeriod.profit || 0)})`,
      `• Keuntungan Terendah: ${lowestProfitPeriod.periodLabel || "0%"} (${formatRupiah(lowestProfitPeriod.profit || 0)})`,
    ];

    // Bagi menjadi kolom untuk menghemat ruang
    const colWidth = Math.ceil(summaryPoints.length / 3);
    const col1Points = summaryPoints.slice(0, colWidth);
    const col2Points = summaryPoints.slice(colWidth, colWidth * 2);
    const col3Points = summaryPoints.slice(colWidth * 2);

    col1Points.forEach((point, index) => {
      doc.text(point, margin, footerY + index * 5);
    });

    col2Points.forEach((point, index) => {
      doc.text(point, margin + 100, footerY + index * 5);
    });

    col3Points.forEach((point, index) => {
      doc.text(point, margin + 200, footerY + index * 5);
    });

    // Footer dengan nomor halaman
    const totalPages = doc.internal.pages.length;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text(`${report.name} - ${report.period} | Halaman ${i} dari ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
    }

    doc.save(`${report.name}-${report.period}.pdf`);
  };

  return (
    <div className="relative">
      {/* Background Pattern for Neo-Brutalist effect */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        {positions.map((pos, i) => (
          <div
            key={i}
            className="absolute transform rotate-45 border-2 border-black"
            style={{
              left: pos.left,
              top: pos.top,
              width: "20px",
              height: "20px",
            }}
          />
        ))}
      </div>

      {/* Download buttons */}
      <div className="flex justify-end mb-4 gap-2">
        <button
          onClick={handleDownloadExcel}
          className="px-4 py-2 bg-[#FFE66D] font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
          title="Download Excel"
        >
          <FileText size={20} />
          EXCEL
        </button>
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-[#FF6B6B] font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2 text-white"
          title="Download PDF"
        >
          <FileDown size={20} />
          PDF
        </button>
      </div>

      {/* Tab navigation - Neo-Brutalist Style */}
      <div className="flex border-b-4 border-black mb-6">
        <button className={`px-6 py-3 mr-2 font-black text-lg transform ${activeTab === "overview" ? "bg-black text-white -rotate-2" : "bg-white rotate-1"} border-4 border-black transition-all`} onClick={() => setActiveTab("overview")}>
          GAMBARAN UMUM
        </button>
        <button className={`px-6 py-3 mr-2 font-black text-lg transform ${activeTab === "trends" ? "bg-black text-white -rotate-2" : "bg-white rotate-1"} border-4 border-black transition-all`} onClick={() => setActiveTab("trends")}>
          TREN
        </button>
        <button
          className={`px-6 py-3 mr-2 font-black text-lg transform ${activeTab === "projections" ? "bg-black text-white -rotate-2" : "bg-white rotate-1"} border-4 border-black transition-all`}
          onClick={() => setActiveTab("projections")}
        >
          PROYEKSI
        </button>
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div>
          {/* Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
              <h3 className="text-xl font-black mb-4">Total Penjualan</h3>
              <p className="text-3xl font-black">{formatRupiah(report.totalAmount)}</p>
              {overallGrowth && (
                <div className="mt-2">
                  <GrowthIndicator value={overallGrowth} size="md" />
                </div>
              )}
            </div>

            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
              <h3 className="text-xl font-black mb-4">Total Keuntungan</h3>
              <p className="text-3xl font-black">{formatRupiah(report.totalProfit)}</p>
              <p className="font-bold mt-2">Margin: {(report.profitMargin * 100).toFixed(2)}%</p>
            </div>

            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
              <h3 className="text-xl font-black mb-4">Total Biaya</h3>
              <p className="text-3xl font-black">{formatRupiah(report.totalAmount - report.totalProfit)}</p>
              <p className="font-bold mt-2">dari total penjualan</p>
            </div>

            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
              <h3 className="text-xl font-black mb-4">Periode Terbaik</h3>
              <p className="text-xl font-black truncate">{highestProfitPeriod.periodLabel || "0%"}</p>
              <p className="font-bold mt-2 text-green-600">{formatRupiah(highestProfitPeriod.profit || 0)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Profit vs Cost Chart */}
            <div className="relative bg-white border-4 border-black p-6 transition-all duration-300 group">
              {/* Glowing effect on hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 via-blue-500 to-indigo-600 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />

              <div className="relative transition-all duration-300">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="transform -rotate-2 bg-gradient-to-r from-purple-400 to-blue-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-xl font-black tracking-tighter">PENJUALAN vs BIAYA</h2>
                  </div>
                  <div className="bg-black text-white p-3 transform rotate-3 hover:rotate-6 transition-transform">
                    <DollarSign size={24} />
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#000" strokeWidth={1} opacity={0.1} />
                    <XAxis dataKey="periodLabel" stroke="#000" strokeWidth={2} tick={{ fill: "#000", fontWeight: "bold" }} tickLine={{ stroke: "#000" }} />
                    <YAxis yAxisId="left" stroke="#000" strokeWidth={2} tick={{ fill: "#000" }} tickFormatter={(value) => formatRupiah(value)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="square"
                      iconSize={15}
                      wrapperStyle={{
                        border: "2px solid black",
                        backgroundColor: "#ffffff",
                        padding: "8px",
                        fontWeight: "bold",
                      }}
                    />
                    <Bar yAxisId="left" dataKey="totalSales" name="Penjualan" fill={TOTAL_SALES_COLOR} stroke="#000" strokeWidth={2} radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="left" dataKey="totalModal" name="Biaya" fill={TOTAL_COST_COLOR} stroke="#000" strokeWidth={2} radius={[4, 4, 0, 0]} />
                    <Line
                      yAxisId="left"
                      dataKey="profit"
                      name="Keuntungan"
                      stroke="#000"
                      strokeWidth={3}
                      dot={{ fill: PROFIT_COLOR, stroke: "#000", strokeWidth: 2, r: 6 }}
                      activeDot={{ fill: PROFIT_COLOR, stroke: "#000", strokeWidth: 2, r: 8 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-2 -right-2 bg-yellow-300 border-2 border-black p-1 transform rotate-12">
                <DollarSign size={20} />
              </div>
              <div className="absolute -bottom-2 -left-2 bg-pink-400 border-2 border-black p-1 transform -rotate-12">
                <Sparkles size={20} />
              </div>
            </div>

            {/* Profit Margin Chart */}
            <div className="relative bg-white border-4 border-black p-6 transition-all duration-300 group">
              {/* Glowing effect on hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />

              <div className="relative transition-all duration-300">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="transform -rotate-2 bg-gradient-to-r from-yellow-300 to-yellow-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-xl font-black tracking-tighter">MARGIN KEUNTUNGAN</h2>
                  </div>
                  <div className="bg-black text-white p-3 transform rotate-3 hover:rotate-6 transition-transform">
                    <Percent size={24} />
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#000" strokeWidth={1} opacity={0.1} />
                    <XAxis dataKey="periodLabel" stroke="#000" strokeWidth={2} tick={{ fill: "#000", fontWeight: "bold" }} tickLine={{ stroke: "#000" }} />
                    <YAxis stroke="#000" strokeWidth={2} tick={{ fill: "#000" }} tickFormatter={(value) => `${value.toFixed(1)}%`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="square"
                      iconSize={15}
                      wrapperStyle={{
                        border: "2px solid black",
                        backgroundColor: "#ffffff",
                        padding: "8px",
                        fontWeight: "bold",
                      }}
                    />
                    {/* Target margin reference line */}
                    <ReferenceLine
                      y={avgProfitMargin}
                      stroke="#000"
                      strokeDasharray="3 3"
                      label={{
                        value: "Avg margin",
                        position: "right",
                        fill: "#000",
                        fontSize: 12,
                      }}
                    />
                    <Area type="monotone" dataKey="profitMargin" name="Profit Margin" fill={PROFIT_MARGIN_COLOR} stroke="#000" strokeWidth={2} fillOpacity={0.6} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-2 -left-2 bg-pink-400 border-2 border-black p-1 transform rotate-12">
                <Percent size={20} />
              </div>
            </div>
          </div>

          {/* Significant Changes */}
          {significantChanges.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-black mb-4 transform -rotate-1 inline-block bg-black text-white border-4 border-black p-3">PERUBAHAN PERIODE YANG SIGNIFIKAN</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {significantChanges.map((period, index) => (
                  <div key={index} className={`p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${period.changeType === "positive" ? "bg-green-100" : "bg-red-100"}`}>
                    <h4 className="font-bold text-lg">{period.periodLabel}</h4>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Perubahan Keuntungan:</span>
                        <GrowthIndicator value={period.popGrowth as number} size="md" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Perubahan Penjualan:</span>
                        <GrowthIndicator value={period.salesGrowth as number} size="sm" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Perubahan Biaya:</span>
                        <GrowthIndicator value={period.costGrowth as number} size="sm" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Perubahan Margin :</span>
                        <GrowthIndicator value={period.marginGrowth as number} size="sm" />
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-white border-2 border-black">
                      <div className="flex justify-between">
                        <span>Keuntungan:</span>
                        <span className="font-bold">{formatRupiah(period.profit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Margin:</span>
                        <span className="font-bold">{period.profitMargin.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trends tab */}
      {activeTab === "trends" && (
        <div>
          {/* Profit Trend Chart */}
          <div className="relative bg-white border-4 border-black p-6 transition-all duration-300 group mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 via-green-500 to-blue-600 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />

            <div className="relative transition-all duration-300">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="transform -rotate-2 bg-gradient-to-r from-blue-400 to-green-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h2 className="text-xl font-black tracking-tighter">TREN KEUNTUNGAN</h2>
                </div>
                <div className="bg-black text-white p-3 transform rotate-3 hover:rotate-6 transition-transform">
                  <TrendingUp size={24} />
                </div>
              </div>

              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#000" strokeWidth={1} opacity={0.1} />
                  <XAxis dataKey="periodLabel" stroke="#000" strokeWidth={2} tick={{ fill: "#000", fontWeight: "bold" }} tickLine={{ stroke: "#000" }} />
                  <YAxis stroke="#000" strokeWidth={2} tick={{ fill: "#000" }} tickFormatter={(value) => formatRupiah(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="square"
                    iconSize={15}
                    wrapperStyle={{
                      border: "2px solid black",
                      backgroundColor: "#ffffff",
                      padding: "8px",
                      fontWeight: "bold",
                    }}
                  />

                  {/* Reference lines for highest and lowest profit */}
                  {highestProfitPeriod.profit && (
                    <ReferenceLine
                      y={highestProfitPeriod.profit}
                      stroke="#00aa00"
                      strokeDasharray="3 3"
                      label={{
                        value: "Highest profit",
                        position: "right",
                        fill: "#00aa00",
                        fontSize: 12,
                      }}
                    />
                  )}

                  {lowestProfitPeriod.profit && lowestProfitPeriod.profit > 0 && (
                    <ReferenceLine
                      y={lowestProfitPeriod.profit}
                      stroke="#aa0000"
                      strokeDasharray="3 3"
                      label={{
                        value: "Lowest profit",
                        position: "right",
                        fill: "#aa0000",
                        fontSize: 12,
                      }}
                    />
                  )}

                  <Line
                    type="monotone"
                    dataKey="profit"
                    name="Profit"
                    stroke="#000"
                    strokeWidth={3}
                    dot={{ fill: PROFIT_COLOR, stroke: "#000", strokeWidth: 2, r: 6 }}
                    activeDot={{ fill: PROFIT_COLOR, stroke: "#000", strokeWidth: 2, r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Growth Rate Chart */}
          <div className="relative bg-white border-4 border-black p-6 transition-all duration-300 group mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-400 via-purple-500 to-red-600 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />

            <div className="relative transition-all duration-300">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="transform -rotate-2 bg-gradient-to-r from-pink-400 to-purple-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h2 className="text-xl font-black tracking-tighter">TINGKAT PERTUMBUHAN</h2>
                </div>
                <div className="bg-black text-white p-3 transform rotate-3 hover:rotate-6 transition-transform">
                  <TrendingUp size={24} />
                </div>
              </div>

              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={popGrowthData.filter((item) => item.popGrowth !== null)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#000" strokeWidth={1} opacity={0.1} />
                  <XAxis dataKey="periodLabel" stroke="#000" strokeWidth={2} tick={{ fill: "#000", fontWeight: "bold" }} tickLine={{ stroke: "#000" }} />
                  <YAxis stroke="#000" strokeWidth={2} tick={{ fill: "#000" }} tickFormatter={(value) => `${value.toFixed(1)}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="square"
                    iconSize={15}
                    wrapperStyle={{
                      border: "2px solid black",
                      backgroundColor: "#ffffff",
                      padding: "8px",
                      fontWeight: "bold",
                    }}
                  />

                  {/* Reference line for zero growth */}
                  <ReferenceLine y={0} stroke="#000" strokeWidth={2} />

                  {/* Use bar for Profit Growth */}
                  <Bar dataKey="popGrowth" name="Profit Growth" fill="#FFE66D" stroke="#000" strokeWidth={2} radius={[4, 4, 0, 0]} />

                  {/* Use bar for Sales Growth with teal color */}
                  <Bar dataKey="salesGrowth" name="Sales Growth" fill="#4ECDC4" stroke="#000" strokeWidth={2} radius={[4, 4, 0, 0]} />

                  {/* Use bar for Margin Growth with much more distinct color (purple) */}
                  <Bar dataKey="marginGrowth" name="Margin Growth" fill="#9C58D3" stroke="#000" strokeWidth={2} radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Decorative elements to match SALES vs COST */}
            <div className="absolute -top-2 -right-2 bg-yellow-300 border-2 border-black p-1 transform rotate-12">
              <TrendingUp size={20} />
            </div>
            <div className="absolute -bottom-2 -left-2 bg-pink-400 border-2 border-black p-1 transform -rotate-12">
              <Sparkles size={20} />
            </div>
          </div>
          {/* Period Detail Table */}
          <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-[500px] overflow-y-scroll">
            <table className="min-w-full bg-white">
              <thead className="bg-black text-white">
                <tr>
                  <th className="py-3 px-4 text-left">Periode</th>
                  <th className="py-3 px-4 text-right">Total Penjualan </th>
                  <th className="py-3 px-4 text-right">Total Biaya</th>
                  <th className="py-3 px-4 text-right">Keuntungan</th>
                  <th className="py-3 px-4 text-right">Margin</th>
                  <th className="py-3 px-4 text-right">Pesanan</th>
                  <th className="py-3 px-4 text-right">Pertumbuhan</th>
                </tr>
              </thead>
              <tbody>
                {popGrowthData.map((period, index) => (
                  <tr key={index} className={`border-b hover:bg-gray-50 ${period.periodLabel === highestProfitPeriod.periodLabel ? "bg-green-100" : period.periodLabel === lowestProfitPeriod.periodLabel ? "bg-red-100" : ""}`}>
                    <td className="py-2 px-4 border-r border-gray-200 font-bold">{period.periodLabel}</td>
                    <td className="py-2 px-4 text-right border-r border-gray-200">{formatRupiah(period.totalSales)}</td>
                    <td className="py-2 px-4 text-right border-r border-gray-200">{formatRupiah(period.totalModal)}</td>
                    <td className="py-2 px-4 text-right border-r border-gray-200 font-medium">{formatRupiah(period.profit)}</td>
                    <td className="py-2 px-4 text-right border-r border-gray-200">{period.profitMargin.toFixed(2)}%</td>
                    <td className="py-2 px-4 text-right border-r border-gray-200">{period.totalOrders}</td>
                    <td className="py-2 px-4 text-right">{period.popGrowth !== null ? <span className={period.popGrowth >= 0 ? "text-green-600" : "text-red-600"}>{period.popGrowth.toFixed(2)}%</span> : "0%"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Projections tab */}
      {activeTab === "projections" && (
        <div>
          {/* Projection Chart */}
          <div className="relative bg-white border-4 border-black p-6 transition-all duration-300 group mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 via-blue-500 to-green-600 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />

            <div className="relative transition-all duration-300">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="transform -rotate-2 bg-gradient-to-r from-purple-400 to-blue-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <h2 className="text-xl font-black tracking-tighter">PROYEKSI KEUNTUNGAN</h2>
                </div>
                <div className="bg-black text-white p-3 transform rotate-3 hover:rotate-6 transition-transform">
                  <Sparkles size={24} />
                </div>
              </div>

              <div className="p-3 bg-yellow-100 border-2 border-black mb-4">
                <p className="font-medium text-sm flex items-center">
                  <Sparkles size={16} className="mr-2" />
                  Proyeksi didasarkan pada tren historis dan harus digunakan sebagai perkiraan saja.Hasil yang sebenarnya dapat bervariasi.
                </p>
              </div>

              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#000" strokeWidth={1} opacity={0.1} />
                  <XAxis dataKey="periodLabel" stroke="#000" strokeWidth={2} tick={{ fill: "#000", fontWeight: "bold" }} tickLine={{ stroke: "#000" }} />
                  <YAxis stroke="#000" strokeWidth={2} tick={{ fill: "#000" }} tickFormatter={(value) => formatRupiah(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="square"
                    iconSize={15}
                    wrapperStyle={{
                      border: "2px solid black",
                      backgroundColor: "#ffffff",
                      padding: "8px",
                      fontWeight: "bold",
                    }}
                  />

                  {/* Split between historical and projected data */}
                  {projectedData.length > 0 && (
                    <ReferenceLine
                      x={chartData[chartData.length - 1].periodLabel}
                      stroke="#000"
                      strokeDasharray="3 3"
                      label={{
                        value: "Current",
                        position: "top",
                        fill: "#000",
                        fontSize: 12,
                      }}
                    />
                  )}

                  <Line
                    type="monotone"
                    dataKey="profit"
                    name="Keuntungan"
                    stroke="#000"
                    strokeWidth={3}
                    dot={(props) => {
                      const { cx, cy, payload, index } = props;
                      // Different styling for projected data points
                      if (payload.isProjected) {
                        return (
                          <svg key={`profit-dot-${index}`}>
                            <circle cx={cx} cy={cy} r={6} fill="#FFF" stroke="#000" strokeWidth={2} />
                            <circle cx={cx} cy={cy} r={3} fill={PROFIT_COLOR} stroke="none" />
                          </svg>
                        );
                      }
                      return <circle key={`profit-dot-${index}`} cx={cx} cy={cy} r={6} fill={PROFIT_COLOR} stroke="#000" strokeWidth={2} />;
                    }}
                    activeDot={{ fill: PROFIT_COLOR, stroke: "#000", strokeWidth: 2, r: 8 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="totalSales"
                    name="Penjualan"
                    stroke={TOTAL_SALES_COLOR}
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload, index } = props;
                      if (payload.isProjected) {
                        return (
                          <svg key={`sales-dot-${index}`}>
                            <circle cx={cx} cy={cy} r={5} fill="#FFF" stroke={TOTAL_SALES_COLOR} strokeWidth={2} />
                            <circle cx={cx} cy={cy} r={2} fill={TOTAL_SALES_COLOR} stroke="none" />
                          </svg>
                        );
                      }
                      return <circle key={`sales-dot-${index}`} cx={cx} cy={cy} r={4} fill={TOTAL_SALES_COLOR} stroke="#000" strokeWidth={1} />;
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="totalModal"
                    name="Biaya"
                    stroke={TOTAL_COST_COLOR}
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload, index } = props;
                      if (payload.isProjected) {
                        return (
                          <svg key={`cost-dot-${index}`}>
                            <circle cx={cx} cy={cy} r={5} fill="#FFF" stroke={TOTAL_COST_COLOR} strokeWidth={2} />
                            <circle cx={cx} cy={cy} r={2} fill={TOTAL_COST_COLOR} stroke="none" />
                          </svg>
                        );
                      }
                      return <circle key={`cost-dot-${index}`} cx={cx} cy={cy} r={4} fill={TOTAL_COST_COLOR} stroke="#000" strokeWidth={1} />;
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Projection Data */}
          {projectedData.length > 0 && (
            <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-bold text-xl mb-4">Proyeksi Kinerja</h3>

              <table className="min-w-full bg-white">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="py-3 px-4 text-left">Periode</th>
                    <th className="py-3 px-4 text-right">Proyeksi Penjualan</th>
                    <th className="py-3 px-4 text-right">Proyeksi Biaya</th>
                    <th className="py-3 px-4 text-right">Proyeksi Keuntungan</th>
                    <th className="py-3 px-4 text-right">Margin yang Diproyeksikan</th>
                  </tr>
                </thead>
                <tbody>
                  {projectedData.map((period, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50 bg-yellow-50">
                      <td className="py-2 px-4 border-r border-gray-200 font-bold">{period.periodLabel}</td>
                      <td className="py-2 px-4 text-right border-r border-gray-200">{formatRupiah(period.totalSales)}</td>
                      <td className="py-2 px-4 text-right border-r border-gray-200">{formatRupiah(period.totalModal)}</td>
                      <td className="py-2 px-4 text-right border-r border-gray-200 font-medium">{formatRupiah(period.profit)}</td>
                      <td className="py-2 px-4 text-right">{period.profitMargin.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 p-3 bg-yellow-100 border-2 border-black">
                <h4 className="font-bold mb-1">Metodologi Proyeksi</h4>
                <p className="text-sm">
                  Proyeksi ini dihitung berdasarkan tren pertumbuhan historis dari periode terakhir. Model proyeksi menganalisis pola kinerja masa lalu Anda dan memperkirakan kinerja masa depan, dengan asumsi kondisi pasar yang sama terus berlanjut. Keputusan bisnis, perubahan pasar, atau variasi musiman dapat memengaruhi hasil aktual.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfitPerformanceDashboard;
