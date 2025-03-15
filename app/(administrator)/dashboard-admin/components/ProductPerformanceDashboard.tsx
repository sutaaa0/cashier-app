import React, { useState } from 'react';
import {  Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart,
} from 'recharts';
import { ProductPerformanceReportData } from '@/server/actions';
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { FileText, FileDown } from "lucide-react";

// Warna untuk chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Format angka ke format mata uang IDR
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

interface ProductPerformanceDashboardProps {
  report: ProductPerformanceReportData;
}

export const ProductPerformanceDashboard: React.FC<ProductPerformanceDashboardProps> = ({ report }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Handle download Excel function
  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Create Products sheet
    const productsData = report.data.map((product) => ({
      "Ranking": product.ranking,
      "Produk": product.productName,
      "Kategori": product.category,
      "Harga Jual": formatCurrency(product.PriceSale || 0),
      "Modal per Produk": formatCurrency(product.PriceCapital || 0),
      "Terjual": product.quantitySold,
      "Total Penjualan": formatCurrency(product.totalSales),
      "Kontribusi": `${product.salesContribution.toFixed(1)}%`,
      "Margin": `${product.profitMargin.toFixed(1)}%`,
      "Total Modal": formatCurrency(product.totalSales - product.profitAmount),
      "Stok": product.stockLevel
    }));
    
    const ws1 = XLSX.utils.json_to_sheet(productsData);
    XLSX.utils.book_append_sheet(wb, ws1, "Produk");
    
    // Create Category sheet
    const categoryData = report.categorySummary.map((category) => ({
      "Kategori": category.categoryName,
      "Total Penjualan": formatCurrency(category.totalSales),
      "Jumlah Terjual": category.quantitySold,
      "Kontribusi": `${category.salesContribution.toFixed(1)}%`,
      "Jumlah Produk": category.productCount,
      "Produk Tanpa Penjualan": category.productCountWithNoSales,
      "Produk Terlaris": category.bestSellingProduct,
      "Margin Rata-rata": `${category.avgProfitMargin.toFixed(1)}%`
    }));
    
    const ws2 = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, ws2, "Kategori");
    
    // Create Summary sheet
    const summaryData = [{
      "Nama Laporan": report.name,
      "Periode": report.period,
      "Tanggal Dibuat": new Date(report.generatedDate).toLocaleString(),
      "Total Penjualan": formatCurrency(report.totalSales),
      "Total Keuntungan": formatCurrency(report.totalProfit),
      "Total Modal": formatCurrency(report.totalSales - report.totalProfit),
      "Margin Keuntungan Rata-rata": `${report.avgProfitMargin.toFixed(1)}%`,
      "Total Produk Terjual": report.totalProductsSold,
      "Jumlah Jenis Produk": report.data.length,
      "Produk Tanpa Penjualan": report.productsWithNoSales.length,
      "Jumlah Kategori": report.categorySummary.length,
      "Produk Terlaris": report.data[0]?.productName || "N/A",
      "Kategori Terlaris": report.categorySummary[0]?.categoryName || "N/A",
    }];
    
    const ws3 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws3, "Ringkasan");
    
    // Create Products with no sales sheet
    const noSalesData = report.productsWithNoSales.map((product) => ({
      "Produk": product.productName,
      "Kategori": product.category,
      "Harga Jual": formatCurrency(product.PriceSale || 0),
      "Modal per Produk": formatCurrency(product.PriceCapital || 0),
      "Stok": product.stockLevel
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
    const doc = new jsPDF('landscape');
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
    
    // Mulai tabel produk
    const startY = 35;
    
    // Menyiapkan kolom sesuai kebutuhan
    const productsTableColumns = [
      { header: 'No', dataKey: 'no', width: 15 },
      { header: 'Produk', dataKey: 'name', width: 55 },
      { header: 'Harga Jual', dataKey: 'price', width: 28 },
      { header: 'Modal', dataKey: 'cost', width: 28 },
      { header: 'Terjual', dataKey: 'sold', width: 20 },
      { header: 'Total Penjualan', dataKey: 'totalSales', width: 30 },
      { header: 'Kontribusi', dataKey: 'contrib', width: 20 },
      { header: 'Margin', dataKey: 'margin', width: 20 },
      { header: 'Stok', dataKey: 'stock', width: 20 }
    ];
    
    // Menyiapkan data produk
    const productsData = report.data.map(product => {
      return [
        product.ranking || '',
        product.productName || '',
        formatCurrency(product.PriceSale || 0),
        formatCurrency(product.PriceCapital || 0),
        product.quantitySold || 0,
        formatCurrency(product.totalSales || 0),
        `${(product.salesContribution || 0).toFixed(1)}%`,
        `${(product.profitMargin || 0).toFixed(1)}%`,
        product.stockLevel || 0
      ];
    });
    
    doc.autoTable({
      startY,
      head: [productsTableColumns.map(col => col.header)],
      body: productsData,
      theme: 'grid',
      headStyles: { 
        fillColor: [41, 128, 185], 
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      styles: {
        font: 'helvetica',
        fontSize: 7,
        overflow: 'linebreak',
        cellPadding: 2,
        lineWidth: 0.1
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: productsTableColumns[0].width },
        1: { cellWidth: productsTableColumns[1].width },
        2: { halign: 'right', cellWidth: productsTableColumns[2].width },
        3: { halign: 'right', cellWidth: productsTableColumns[3].width },
        4: { halign: 'right', cellWidth: productsTableColumns[4].width },
        5: { halign: 'right', cellWidth: productsTableColumns[5].width },
        6: { halign: 'right', cellWidth: productsTableColumns[6].width },
        7: { halign: 'right', cellWidth: productsTableColumns[7].width },
        8: { halign: 'right', cellWidth: productsTableColumns[8].width }
      },
      didParseCell: (data) => {
        // Tandai produk tanpa penjualan dengan background merah
        const productData = data.row.raw;
        if (productData && Array.isArray(productData) && productData[4] === 0) { // Kolom "Terjual" = 0
          data.cell.styles.fillColor = [255, 235, 235];
        }
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      margin: { left: margin, right: margin }
    });
    
    // Tambahkan ringkasan di bagian bawah dengan ukuran font kecil
    let footerY = (doc.lastAutoTable?.finalY ?? startY) + 10;
    
    // Cek apakah perlu halaman baru untuk ringkasan
    if (footerY > pageHeight - 40) {
      doc.addPage('landscape');
      footerY = 15;
    }
    
    // Bagian ringkasan
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Ringkasan Laporan", margin, footerY);
    
    footerY += 6;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    // Poin-poin ringkasan dalam format kompak
    const summaryPoints = [
      `• Total Penjualan: ${formatCurrency(report.totalSales || 0)}`,
      `• Total Modal: ${formatCurrency(report.totalSales - report.totalProfit || 0)}`,
      `• Total Keuntungan: ${formatCurrency(report.totalProfit || 0)}`,
      `• Margin Rata-rata: ${(report.avgProfitMargin || 0).toFixed(1)}%`,
      `• Total Produk Terjual: ${(report.totalProductsSold || 0).toLocaleString()}`,
      `• Jumlah Produk: ${report.data.length || 0}`,
      `• Produk Tanpa Penjualan: ${report.productsWithNoSales?.length || 0}`
    ];
    
    // Bagi menjadi 3 kolom untuk menghemat ruang
    const colWidth = Math.floor(summaryPoints.length / 3);
    const col1Points = summaryPoints.slice(0, colWidth);
    const col2Points = summaryPoints.slice(colWidth, colWidth * 2);
    const col3Points = summaryPoints.slice(colWidth * 2);
    
    col1Points.forEach((point, index) => {
      doc.text(point, margin, footerY + (index * 5));
    });
    
    col2Points.forEach((point, index) => {
      doc.text(point, margin + 100, footerY + (index * 5));
    });
    
    col3Points.forEach((point, index) => {
      doc.text(point, margin + 200, footerY + (index * 5));
    });
    
    // Footer dengan nomor halaman
    const totalPages = doc.internal.pages.length;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text(
        `${report.name} - ${report.period} | Halaman ${i} dari ${totalPages}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    }
    
    doc.save(`${report.name}-${report.period}.pdf`);
  };
  
  return (
    <div>
      {/* Download buttons */}
      <div className="flex justify-end mb-4 gap-2">
        <button
          onClick={handleDownloadExcel}
          className="px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
          title="Download Excel"
        >
          <FileText size={20} />
          Unduh Excel
        </button>
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
          title="Download PDF"
        >
          <FileDown size={20} />
          Unduh PDF
        </button>
      </div>
      
      {/* Tab navigation */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 mr-2 ${activeTab === 'overview' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 mr-2 ${activeTab === 'products' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('products')}
        >
          Produk
        </button>
      </div>
      
      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-4">Top 5 Produk Terlaris</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart
                  data={report.data.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => new Intl.NumberFormat('id-ID').format(value)} />
                  <YAxis 
                    type="category" 
                    dataKey="productName" 
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number | string, name: string) => {
                      if (name === 'totalSales') return [formatCurrency(Number(value)), 'Total Penjualan'];
                      if (name === 'prevPeriodSales') return [formatCurrency(Number(value)), 'Penjualan Sebelumnya'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Produk: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="totalSales" name="Penjualan" fill="#0088FE" />
                  <Bar dataKey="prevPeriodSales" name="Periode Sebelumnya" fill="#82ca9d" opacity={0.6} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-4">Distribusi Penjualan per Kategori</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={report.categorySummary}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="totalSales"
                    nameKey="categoryName"
                    label={({ categoryName, salesContribution }) => `${categoryName}: ${salesContribution.toFixed(1)}%`}
                  >
                    {report.categorySummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string, props?: { payload?: { categoryName: string } }) => {
                      return [formatCurrency(value), props?.payload?.categoryName || ''];
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-8">
            <h3 className="font-bold text-lg mb-4">Ringkasan Metrik</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded shadow-md">
                <p className="text-gray-500 text-sm">Total Penjualan</p>
                <p className="text-xl font-bold">{formatCurrency(report.totalSales)}</p>
                {report.salesGrowth && (
                  <p className={`text-sm ${report.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {report.salesGrowth >= 0 ? '↑' : '↓'} {Math.abs(report.salesGrowth).toFixed(1)}%
                  </p>
                )}
              </div>
              <div className="bg-white p-4 rounded shadow-md">
                <p className="text-gray-500 text-sm">Total Keuntungan</p>
                <p className="text-xl font-bold">{formatCurrency(report.totalProfit)}</p>
                <p className="text-sm text-gray-600">Margin: {report.avgProfitMargin.toFixed(1)}%</p>
              </div>
              <div className="bg-white p-4 rounded shadow-md">
                <p className="text-gray-500 text-sm">Total Modal</p>
                <p className="text-xl font-bold">{formatCurrency(report.totalSales - report.totalProfit)}</p>
                <p className="text-sm text-gray-600">dari total penjualan</p>
              </div>
              <div className="bg-white p-4 rounded shadow-md">
                <p className="text-gray-500 text-sm">Produk Tanpa Penjualan</p>
                <p className="text-xl font-bold">{report.productsWithNoSales.length}</p>
                <p className="text-sm text-red-500">Perlu Perhatian</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Products tab */}
      {activeTab === 'products' && (
        <div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 text-left border">Rank</th>
                  <th className="py-2 px-4 text-left border">Produk</th>
                  <th className="py-2 px-4 text-left border">Kategori</th>
                  <th className="py-2 px-4 text-right border">Harga Jual</th>
                  <th className="py-2 px-4 text-right border">Modal per Produk</th>
                  <th className="py-2 px-4 text-right border">Terjual</th>
                  <th className="py-2 px-4 text-right border">Total Penjualan</th>
                  <th className="py-2 px-4 text-right border">Kontribusi</th>
                  <th className="py-2 px-4 text-right border">Margin</th>
                  <th className="py-2 px-4 text-right border">Total Modal</th>
                  <th className="py-2 px-4 text-right border">Stok</th>
                </tr>
              </thead>
              <tbody>
                {report.data.map((product) => (
                  <tr key={product.produkId} className={`border-b hover:bg-gray-50 ${product.quantitySold === 0 ? 'bg-red-50' : ''}`}>
                    <td className="py-2 px-4 border">{product.ranking}</td>
                    <td className="py-2 px-4 border font-medium">{product.productName}</td>
                    <td className="py-2 px-4 border">{product.category}</td>
                    <td className="py-2 px-4 text-right border">{formatCurrency(product.PriceSale || 0)}</td>
                    <td className="py-2 px-4 text-right border">{formatCurrency(product.PriceCapital || 0)}</td>
                    <td className="py-2 px-4 text-right border">{product.quantitySold}</td>
                    <td className="py-2 px-4 text-right border">{formatCurrency(product.totalSales)}</td>
                    <td className="py-2 px-4 text-right border">{product.salesContribution.toFixed(1)}%</td>
                    <td className="py-2 px-4 text-right border">{product.profitMargin.toFixed(1)}%</td>
                    <td className="py-2 px-4 text-right border">{formatCurrency(product.totalSales - product.profitAmount)}</td>
                    <td className={`py-2 px-4 text-right border ${
                      product.stockLevel === 0 ? 'text-red-600 font-bold' : 
                      (product.stockLevel < 10 ? 'text-yellow-600 font-bold' : '')
                    }`}>
                      {product.stockLevel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {report.productsWithNoSales.length > 0 && (
            <div className="mt-8 bg-red-50 p-4 rounded-lg border-2 border-red-200">
              <h3 className="font-bold text-lg mb-4 text-red-800">Produk Tanpa Penjualan ({report.productsWithNoSales.length})</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead className="bg-red-100">
                    <tr>
                      <th className="py-2 px-4 text-left border">Produk</th>
                      <th className="py-2 px-4 text-left border">Kategori</th>
                      <th className="py-2 px-4 text-right border">Harga Jual</th>
                      <th className="py-2 px-4 text-right border">Modal per Produk</th>
                      <th className="py-2 px-4 text-right border">Stok</th>
                      <th className="py-2 px-4 text-left border">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.productsWithNoSales.map((product) => (
                      <tr key={product.produkId} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4 border font-medium">{product.productName}</td>
                        <td className="py-2 px-4 border">{product.category}</td>
                        <td className="py-2 px-4 text-right border">{formatCurrency(product.PriceSale || 0)}</td>
                        <td className="py-2 px-4 text-right border">{formatCurrency(product.PriceCapital || 0)}</td>
                        <td className="py-2 px-4 text-right border">{product.stockLevel}</td>
                        <td className="py-2 px-4 border">
                          {(product.prevPeriodSales ?? 0) > 0 ? 
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Menurun</span> : 
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Tidak Laku</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductPerformanceDashboard;