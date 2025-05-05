import React, { useState, useEffect } from "react";
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart } from "recharts";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { FileText, FileDown, Sparkles, TrendingUp, DollarSign, Percent } from "lucide-react";
import { formatRupiah } from "@/lib/formatIdr";

// Vibrant neo-brutalist color palette
const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#FF8364", "#45B7D1", "#96CEB4", "#D4A5A5"];

interface CategorySummary {
  categoryName: string;
  totalSales: number;
  quantitySold: number;
  salesContribution: number;
  productCount: number;
  productCountWithNoSales: number;
  bestSellingProduct: string;
  avgProfitMargin: number;
}

interface Produk {
  produkId: number; // Changed from string to number
  ranking: number;
  productName: string;
  category: string;
  PriceSale?: number;
  PriceCapital?: number;
  quantitySold: number;
  totalSales: number;
  salesContribution: number;
  profitMargin: number;
  profitAmount: number;
  stockLevel: number;
  prevPeriodSales?: number;
}

interface Report {
  name: string;
  period: string;
  generatedDate: string;
  totalSales: number;
  totalProfit: number;
  avgProfitMargin: number;
  totalProductsSold: number;
  productsWithNoSales: Produk[]; // Ensure this matches Produk[]
  categorySummary: CategorySummary[];
  data: Produk[];
  salesGrowth?: number;
}

interface ProductPerformanceDashboardProps {
  report: Report;
}

interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{
    name: string;
    value: number;
  }>;
}

interface PieChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: CategorySummary;
  }>;
}

// Custom tooltip for the pie chart
const PieChartTooltip = ({ active, payload }: PieChartTooltipProps) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    // Find the category summary item that matches the payload
    const categorySummary = item.payload;

    return (
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        <div className="relative bg-white border-4 border-black p-4 transform -rotate-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-yellow-400" size={20} />
            <h3 className="font-black text-xl">{categorySummary.categoryName}</h3>
          </div>
          <div className="font-mono bg-black text-white p-2 transform rotate-1 mb-2">{formatRupiah(categorySummary.totalSales)}</div>
          <div className="font-mono bg-white text-black p-2 border-2 border-black transform -rotate-1">{categorySummary.salesContribution.toFixed(1)}% dari total penjualan</div>
        </div>
      </div>
    );
  }
  return null;
};

const BarChartTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        <div className="relative bg-white border-4 border-black p-4 transform -rotate-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="text-blue-500" size={20} />
            <h3 className="font-black text-xl">{label}</h3>
          </div>

          {payload.map((entry, index) => (
            <div key={index} className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 border-2 border-black" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="font-bold">{entry.name}:</span>
              </div>
              <div className="font-mono p-2 transform rotate-1 border-2 border-black text-white" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                {formatRupiah(entry.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const ProductPerformanceDashboard: React.FC<ProductPerformanceDashboardProps> = ({ report }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [positions, setPositions] = useState<{ left: string; top: string }[]>([]);

  // Generate random positions for decorative elements
  useEffect(() => {
    setPositions(
      [...Array(20)].map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }))
    );
  }, []);

  // Handle download Excel function
  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();

    // Create Products sheet
    const productsData = report.data.map((product: Produk) => ({
      Peringkat: product.ranking,
      Produk: product.productName,
      Kategori: product.category,
      "Harga Jual": formatRupiah(product.PriceSale || 0),
      "Biaya per Produk": formatRupiah(product.PriceCapital || 0),
      Terjual: product.quantitySold,
      "Total Penjualan": formatRupiah(product.totalSales),
      Kontribusi: `${product.salesContribution.toFixed(1)}%`,
      Margin: `${product.profitMargin.toFixed(1)}%`,
      "Total Biaya": formatRupiah(product.totalSales - product.profitAmount),
      Stok: product.stockLevel,
    }));

    const ws1 = XLSX.utils.json_to_sheet(productsData);
    XLSX.utils.book_append_sheet(wb, ws1, "Products");

    // Create Category sheet
    const categoryData = report.categorySummary.map((category: CategorySummary) => ({
      Kategori: category.categoryName,
      "Total Penjualan": formatRupiah(category.totalSales),
      "Jumlah Terjual": category.quantitySold,
      Kontribusi: `${category.salesContribution.toFixed(1)}%`,
      "Jumlah Produk": category.productCount,
      "Produk Tanpa Penjualan": category.productCountWithNoSales,
      "Produk Terlaris": category.bestSellingProduct,
      "Margin Rata-Rata ": `${category.avgProfitMargin.toFixed(1)}%`,
    }));

    const ws2 = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, ws2, "Categories");

    // Create Summary sheet
    const summaryData = [
      {
        "Nama Laporan": report.name,
        Periode: report.period,
        "Tanggal Pembuatan": new Date(report.generatedDate).toLocaleString(),
        "Total Penjualan": formatRupiah(report.totalSales),
        "Total Keuntungan": formatRupiah(report.totalProfit),
        "Total Biaya": formatRupiah(report.totalSales - report.totalProfit),
        "Margin Keuntungan Rata-Rata ": `${report.avgProfitMargin.toFixed(1)}%`,
        "Total Produk Terjual": report.totalProductsSold,
        "Jumlah Produk": report.data.length,
        "Produk Tanpa Penjualan": report.productsWithNoSales.length,
        "Jumlah Kategori": report.categorySummary.length,
        "Produk Terlaris": report.data[0]?.productName || "N/A",
        "Kategori Penjualan Terlaris": report.categorySummary[0]?.categoryName || "N/A",
      },
    ];

    const ws3 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws3, "Summary");

    // Create Products with no sales sheet
    const noSalesData = report.productsWithNoSales.map((product: Produk) => ({
      Produk: product.productName,
      Kategori: product.category,
      "Harga Jual": formatRupiah(product.PriceSale || 0),
      "Biaya per Produk": formatRupiah(product.PriceCapital || 0),
      Stok: product.stockLevel,
    }));

    const ws4 = XLSX.utils.json_to_sheet(noSalesData);
    XLSX.utils.book_append_sheet(wb, ws4, "Produk Tanpa Penjualan");

    // Write the file
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    saveAs(data, `${report.name}-${report.period}.xlsx`);
  };

  // Handle download PDF function
  const handleDownloadPDF = () => {
    const doc = new jsPDF("landscape");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    // Header with smaller font size
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(report.name, margin, 15);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${report.period}`, margin, 22);
    doc.text(`Created: ${new Date(report.generatedDate).toLocaleString()}`, margin, 27);

    // Separator line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, 30, pageWidth - margin, 30);

    // Start products table
    const startY = 35;

    // Prepare columns as needed
    const productsTableColumns = [
      { header: "No", dataKey: "no", width: 15 },
      { header: "Produk", dataKey: "name", width: 55 },
      { header: "Harga Jual", dataKey: "price", width: 28 },
      { header: "Biaya", dataKey: "cost", width: 28 },
      { header: "Terjual", dataKey: "sold", width: 20 },
      { header: "Total Penjualan", dataKey: "totalSales", width: 30 },
      { header: "Kontribusi", dataKey: "contrib", width: 20 },
      { header: "Margin", dataKey: "margin", width: 20 },
      { header: "Stok", dataKey: "stock", width: 20 },
    ];

    // Prepare product data
    const productsData = report.data.map((product) => {
      return [
        product.ranking || "",
        product.productName || "",
        formatRupiah(product.PriceSale || 0),
        formatRupiah(product.PriceCapital || 0),
        product.quantitySold || 0,
        formatRupiah(product.totalSales || 0),
        `${(product.salesContribution || 0).toFixed(1)}%`,
        `${(product.profitMargin || 0).toFixed(1)}%`,
        product.stockLevel || 0,
      ];
    });

    doc.autoTable({
      startY,
      head: [productsTableColumns.map((col) => col.header)],
      body: productsData,
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
        0: { halign: "center", cellWidth: productsTableColumns[0].width },
        1: { cellWidth: productsTableColumns[1].width },
        2: { halign: "right", cellWidth: productsTableColumns[2].width },
        3: { halign: "right", cellWidth: productsTableColumns[3].width },
        4: { halign: "right", cellWidth: productsTableColumns[4].width },
        5: { halign: "right", cellWidth: productsTableColumns[5].width },
        6: { halign: "right", cellWidth: productsTableColumns[6].width },
        7: { halign: "right", cellWidth: productsTableColumns[7].width },
        8: { halign: "right", cellWidth: productsTableColumns[8].width },
      },
      didParseCell: (data) => {
        // Mark products with no sales with red background
        const productData = data.row.raw;
        if (productData && Array.isArray(productData) && productData[4] === 0) {
          // "Sold" column = 0
          data.cell.styles.fillColor = [255, 235, 235];
        }
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
      margin: { left: margin, right: margin },
    });

    // Add summary at the bottom with small font size
    let footerY = (doc.lastAutoTable?.finalY ?? startY) + 10;

    // Check if a new page is needed for the summary
    if (footerY > pageHeight - 40) {
      doc.addPage("landscape");
      footerY = 15;
    }

    // Summary section
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan Laporan", margin, footerY);

    footerY += 6;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    // Summary points in compact format
    const summaryPoints = [
      `• Total Penjualan: ${formatRupiah(report.totalSales || 0)}`,
      `• Total Biaya: ${formatRupiah(report.totalSales - report.totalProfit || 0)}`,
      `• Total Keuntungan: ${formatRupiah(report.totalProfit || 0)}`,
      `• Margin Rata-Rata: ${(report.avgProfitMargin || 0).toFixed(1)}%`,
      `• Total Produk Terjual: ${(report.totalProductsSold || 0).toLocaleString()}`,
      `• Jumlah Produk: ${report.data.length || 0}`,
      `• Produk Tanpa Penjualan: ${report.productsWithNoSales?.length || 0}`,
    ];

    // Split into 3 columns to save space
    const colWidth = Math.floor(summaryPoints.length / 3);
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

    // Footer with page number
    const totalPages = doc.internal.pages.length;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text(`${report.name} - ${report.period} | Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
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
        <button className={`px-6 py-3 mr-2 font-black text-lg transform ${activeTab === "products" ? "bg-black text-white -rotate-2" : "bg-white rotate-1"} border-4 border-black transition-all`} onClick={() => setActiveTab("products")}>
          PRODUK
        </button>
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Top 5 Products Chart */}
            <div className="relative bg-white border-4 border-black p-6 transition-all duration-300 group">
              {/* Glowing effect on hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 via-blue-500 to-indigo-600 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />

              <div className="relative transition-all duration-300">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="transform -rotate-2 bg-gradient-to-r from-purple-400 to-blue-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-xl font-black tracking-tighter">TOP 5 PRODUCTS</h2>
                  </div>
                  <div className="bg-black text-white p-3 transform rotate-3 hover:rotate-6 transition-transform">
                    <TrendingUp size={24} />
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={report.data.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#000" strokeWidth={1} opacity={0.1} />
                    <XAxis type="number" tickFormatter={(value) => formatRupiah(value)} stroke="#000" strokeWidth={2} tick={{ fill: "#000", fontWeight: "bold" }} />
                    <YAxis type="category" dataKey="productName" width={80} tick={{ fontSize: 12, fontWeight: "bold" }} stroke="#000" strokeWidth={2} />
                    <Tooltip content={<BarChartTooltip />} />
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
                    <Bar dataKey="totalSales" name="Penjualan Saat Ini" radius={[0, 4, 4, 0]}>
                      {report.data.slice(0, 5).map((entry, index) => (
                        <Cell key={`totalSales-${index}`} fill={COLORS[0]} stroke="#000" strokeWidth={2} />
                      ))}
                    </Bar>
                    <Bar dataKey="prevPeriodSales" name="Penjualan Periode Sebelumnya" radius={[0, 4, 4, 0]}>
                      {report.data.slice(0, 5).map((entry, index) => (
                        <Cell key={`prevPeriodSales-${index}`} fill={COLORS[1]} stroke="#000" strokeWidth={2} />
                      ))}
                    </Bar>
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

            {/* Category Sales Distribution - PieChart */}
            <div className="relative bg-white border-4 border-black p-6 transition-all duration-300 group">
              {/* Glowing effect on hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />

              <div className="relative transition-all duration-300">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="transform -rotate-2 bg-gradient-to-r from-yellow-300 to-yellow-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-xl font-black tracking-tighter">PENJUALAN KATEGORI</h2>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={report.categorySummary}
                      dataKey="totalSales"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      stroke="#000000"
                      strokeWidth={3}
                      label={({ categoryName, salesContribution }) => `${categoryName}: ${salesContribution.toFixed(1)}%`}
                      labelLine={{ stroke: "#000000", strokeWidth: 1 }}
                    >
                      {report.categorySummary.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="transition-all duration-300" />
                      ))}
                    </Pie>
                    <Tooltip content={<PieChartTooltip />} />
                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      iconType="circle"
                      iconSize={15}
                      formatter={(value, entry, index) => {
                        const { categoryName, salesContribution } = report.categorySummary[index];
                        return (
                          <span style={{ color: "#000000", fontWeight: "bold" }}>
                            {categoryName} ({salesContribution.toFixed(1)}%)
                          </span>
                        );
                      }}
                      wrapperStyle={{
                        border: "2px solid black",
                        backgroundColor: "#ffffff",
                        padding: "8px",
                        borderRadius: "0px",
                        fontWeight: "bold",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-2 -left-2 bg-pink-400 border-2 border-black p-1 transform rotate-12">
                <Percent size={20} />
              </div>
            </div>
          </div>

          {/* Summary Metrics - Neo-Brutalist Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
              <h3 className="text-xl font-black mb-4">Total Penjualan</h3>
              <p className="text-3xl font-black">{formatRupiah(report.totalSales)}</p>
              {report.salesGrowth && (
                <div className={`flex items-center mt-2 ${report.salesGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {report.salesGrowth >= 0 ? <TrendingUp size={20} /> : <TrendingUp size={20} className="transform rotate-180" />}
                  <span className="font-bold">{Math.abs(report.salesGrowth).toFixed(1)}%</span>
                </div>
              )}
            </div>

            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
              <h3 className="text-xl font-black mb-4">Total Keuntungan</h3>
              <p className="text-3xl font-black">{formatRupiah(report.totalProfit)}</p>
              <p className="font-bold mt-2">Margin: {report.avgProfitMargin.toFixed(1)}%</p>
            </div>

            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
              <h3 className="text-xl font-black mb-4">Total Biaya</h3>
              <p className="text-3xl font-black">{formatRupiah(report.totalSales - report.totalProfit)}</p>
              <p className="font-bold mt-2">dari total penjualan</p>
            </div>

            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
              <h3 className="text-xl font-black mb-4">Tidak Ada Penjualan</h3>
              <p className="text-3xl font-black">{report.productsWithNoSales.length}</p>
              <p className="font-bold mt-2 text-red-500">Membutuhkan Perhatian</p>
            </div>
          </div>
        </div>
      )}

      {/* Products tab */}
      {activeTab === "products" && (
        <div>
          <div className="overflow-x-auto bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-[500px] overflow-y-scroll">
            <table className="min-w-full bg-white">
              <thead className="bg-black text-white">
                <tr>
                  <th className="py-3 px-4 text-left">Peringkat</th>
                  <th className="py-3 px-4 text-left">Produk</th>
                  <th className="py-3 px-4 text-left">Kategori</th>
                  <th className="py-3 px-4 text-right">Harga jual</th>
                  <th className="py-3 px-4 text-right">Biaya per produk</th>
                  <th className="py-3 px-4 text-right">Terjual</th>
                  <th className="py-3 px-4 text-right">Total Penjualan </th>
                  <th className="py-3 px-4 text-right">Kontribusi</th>
                  <th className="py-3 px-4 text-right">Margin</th>
                  <th className="py-3 px-4 text-right">Total biaya</th>
                  <th className="py-3 px-4 text-right">Stok</th>
                </tr>
              </thead>
              <tbody>
                {report.data.map((product: Produk) => (
                  <tr key={product.produkId} className={`border-b hover:bg-gray-50 ${product.quantitySold === 0 ? "bg-red-500 text-white hover:text-red-500 transition-all" : ""}`}>
                    <td className="py-2 px-4 border-r border-gray-200">{product.ranking}</td>
                    <td className="py-2 px-4 border-r border-gray-200 font-bold">{product.productName}</td>
                    <td className="py-2 px-4 border-r border-gray-200">{product.category}</td>
                    <td className="py-2 px-4 text-right border-r border-gray-200">{formatRupiah(product.PriceSale || 0)}</td>
                    <td className="py-2 px-4 text-right border-r border-gray-200">{formatRupiah(product.PriceCapital || 0)}</td>
                    <td className="py-2 px-4 text-right border-r border-gray-200">{product.quantitySold}</td>
                    <td className="py-2 px-4 text-right border-r border-gray-200">{formatRupiah(product.totalSales)}</td>
                    <td className="py-2 px-4 text-right border-r border-gray-200">{product.salesContribution.toFixed(1)}%</td>
                    <td className="py-2 px-4 text-right border-r border-gray-200">{product.profitMargin.toFixed(1)}%</td>
                    <td className="py-2 px-4 text-right border-r border-gray-200">{formatRupiah(product.totalSales - product.profitAmount)}</td>
                    <td className={`py-2 px-4 text-right ${product.stockLevel === 0 ? "text-white" : product.stockLevel < 10 ? "text-yellow-600 font-bold" : ""}`}>{product.stockLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPerformanceDashboard;
