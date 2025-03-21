import React, { useState, useEffect } from 'react';
import {  
  PieChart, 
  Pie, 
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { FileText, FileDown, PackageOpen, AlertTriangle, Truck, TrendingDown } from "lucide-react";
import { formatRupiah } from '@/lib/formatIdr';

// Jumlah pemesanan = (level minimum - stok saat ini) + penjualan 30 hari

// Neo-brutalist color palette
const COLORS = ['#FF8A65', '#4DB6AC', '#FFD54F', '#7986CB', '#4FC3F7', '#AED581', '#F06292'];

interface ProductCategory {
  categoryName: string;
  productCount: number;
  stockValue: number;
  avgStockLevel: number;
  lowStockCount: number;
  outOfStockCount: number;
  stockValuePercentage: number;
}

interface StockProduct {
  produkId: number;
  productName: string;
  category: string;
  hargaModal: number;
  stok: number;
  minimumStok: number;
  statusStok: string; // "LOW", "OUT_OF_STOCK", "NORMAL"
  stockValue: number;
  daysOnHand: number;
  stockTurnoverRate: number;
  lastRestockDate?: Date;
  salesVelocity: number; // Average units sold per day
  estimatedStockOutDate?: Date;
  reorderRecommended: boolean;
  reorderQuantity?: number;
}

interface InventoryAlerts {
  outOfStockCount: number;
  lowStockCount: number;
  excessStockCount: number;
  totalReorderValue: number;
  reorderItemCount: number;
}

interface InventoryReport {
  name: string;
  period: string;
  generatedDate: string;
  totalProducts: number;
  totalStockValue: number;
  avgStockTurnover: number;
  stockProductRatio: number; // Ratio of stock to unique products
  alerts: InventoryAlerts;
  categoryBreakdown: ProductCategory[];
  products: StockProduct[];
}

interface InventoryStockDashboardProps {
  report: InventoryReport;
}

// Custom tooltip for stock level pie chart
interface StockPieTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ProductCategory }>;
}

const StockPieTooltip = ({ active, payload }: StockPieTooltipProps) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const category = item.payload;

    return (
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-teal-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        <div className="relative bg-white border-4 border-black p-4 transform -rotate-1 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2 mb-2">
            <PackageOpen className="text-orange-400" size={20} />
            <h3 className="font-black text-xl">{category.categoryName}</h3>
          </div>
          <div className="font-mono bg-black text-white p-2 transform rotate-1 mb-2">
            {formatRupiah(category.stockValue)}
          </div>
          <div className="font-mono bg-white text-black p-2 border-2 border-black transform -rotate-1">
            {category.stockValuePercentage.toFixed(1)}% of total value
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="font-mono text-sm">Products: {category.productCount}</div>
            <div className="font-mono text-sm">Avg Stock: {category.avgStockLevel}</div>
            <div className={`font-mono text-sm ${category.lowStockCount > 0 ? "text-orange-500 font-bold" : ""}`}>
              Low Stock: {category.lowStockCount}
            </div>
            <div className={`font-mono text-sm ${category.outOfStockCount > 0 ? "text-red-500 font-bold" : ""}`}>
              Out of Stock: {category.outOfStockCount}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const getStockStatusClass = (status: string, stockLevel: number, minStock: number) => {
  if (status === "OUT_OF_STOCK" || stockLevel === 0) {
    return "bg-red-100 text-red-800 border-red-200";
  } else if (status === "LOW" || stockLevel <= minStock) {
    return "bg-orange-100 text-orange-800 border-orange-200";
  } else if (stockLevel > minStock * 3) {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }
  return "bg-green-100 text-green-800 border-green-200";
};

const InventoryStockDashboard: React.FC<InventoryStockDashboardProps> = ({ report }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [positions, setPositions] = useState<{ left: string; top: string }[]>([]);
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'low', 'out', 'excess'
  
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
    const productsData = report.products.map((product) => ({
      "Product ID": product.produkId,
      "Product": product.productName,
      "Category": product.category,
      "Unit Cost": formatRupiah(product.hargaModal),
      "Stock Level": product.stok,
      "Min Stock": product.minimumStok,
      "Status": product.statusStok,
      "Stock Value": formatRupiah(product.stockValue),
      "Sales Velocity": `${product.salesVelocity.toFixed(1)} units/day`,
      "Stock Turnover": product.stockTurnoverRate.toFixed(2),
      "Days On Hand": Math.round(product.daysOnHand),
      "Reorder Recommended": product.reorderRecommended ? "YES" : "NO",
      "Reorder Quantity": product.reorderQuantity || "-"
    }));
    
    const ws1 = XLSX.utils.json_to_sheet(productsData);
    XLSX.utils.book_append_sheet(wb, ws1, "Inventory Items");
    
    // Create Category sheet
    const categoryData = report.categoryBreakdown.map((category) => ({
      "Category": category.categoryName,
      "Product Count": category.productCount,
      "Stock Value": formatRupiah(category.stockValue),
      "Value %": `${category.stockValuePercentage.toFixed(1)}%`,
      "Avg Stock Level": category.avgStockLevel.toFixed(1),
      "Low Stock Count": category.lowStockCount,
      "Out of Stock Count": category.outOfStockCount
    }));
    
    const ws2 = XLSX.utils.json_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, ws2, "Category Breakdown");
    
    // Create Summary sheet
    const summaryData = [{
      "Report Name": report.name,
      "Period": report.period,
      "Generated Date": new Date(report.generatedDate).toLocaleString(),
      "Total Products": report.totalProducts,
      "Total Stock Value": formatRupiah(report.totalStockValue),
      "Avg Stock Turnover": report.avgStockTurnover.toFixed(2),
      "Stock Product Ratio": report.stockProductRatio.toFixed(2),
      "Out of Stock Items": report.alerts.outOfStockCount,
      "Low Stock Items": report.alerts.lowStockCount,
      "Excess Stock Items": report.alerts.excessStockCount,
      "Items Needing Reorder": report.alerts.reorderItemCount,
      "Total Reorder Value": formatRupiah(report.alerts.totalReorderValue)
    }];
    
    const ws3 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws3, "Summary");
    
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
    
    // Start inventory table
    const startY = 35;
    
    // Prepare columns as needed
    const inventoryTableColumns = [
      { header: 'Product', dataKey: 'name', width: 60 },
      { header: 'Category', dataKey: 'category', width: 40 },
      { header: 'Unit Cost', dataKey: 'cost', width: 28 },
      { header: 'Stock', dataKey: 'stock', width: 20 },
      { header: 'Min Stock', dataKey: 'minStock', width: 20 },
      { header: 'Status', dataKey: 'status', width: 25 },
      { header: 'Stock Value', dataKey: 'value', width: 30 },
      { header: 'Turnover', dataKey: 'turnover', width: 20 },
      { header: 'Days On Hand', dataKey: 'days', width: 25 }
    ];
    
    // Prepare inventory data
    const inventoryData = report.products.map(product => {
      return [
        product.productName,
        product.category,
        formatRupiah(product.hargaModal),
        product.stok,
        product.minimumStok,
        product.statusStok,
        formatRupiah(product.stockValue),
        product.stockTurnoverRate.toFixed(2),
        Math.round(product.daysOnHand)
      ];
    });
    
    doc.autoTable({
      startY,
      head: [inventoryTableColumns.map(col => col.header)],
      body: inventoryData,
      theme: 'grid',
      headStyles: { 
        fillColor: [77, 182, 172], 
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
        0: { cellWidth: inventoryTableColumns[0].width },
        1: { cellWidth: inventoryTableColumns[1].width },
        2: { halign: 'right', cellWidth: inventoryTableColumns[2].width },
        3: { halign: 'right', cellWidth: inventoryTableColumns[3].width },
        4: { halign: 'right', cellWidth: inventoryTableColumns[4].width },
        5: { cellWidth: inventoryTableColumns[5].width },
        6: { halign: 'right', cellWidth: inventoryTableColumns[6].width },
        7: { halign: 'right', cellWidth: inventoryTableColumns[7].width },
        8: { halign: 'right', cellWidth: inventoryTableColumns[8].width }
      },
      didParseCell: (data) => {
        // Mark products with stock issues with different background colors
        const productData = data.row.raw as [string, string, string, number, number, string, string, string, number];
        if (productData) {
          if (productData[3] === 0) { // Out of stock
            data.cell.styles.fillColor = [255, 230, 230];
          } else if (productData[3] < productData[4]) { // Low stock
            data.cell.styles.fillColor = [255, 243, 224];
          } else if (productData[3] > productData[4] * 3) { // Excess stock
            data.cell.styles.fillColor = [232, 240, 254];
          }
        }
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      margin: { left: margin, right: margin }
    });
    
    // Add summary at the bottom
    let footerY = (doc.lastAutoTable?.finalY ?? startY) + 10;
    
    // Check if a new page is needed for the summary
    if (footerY > pageHeight - 40) {
      doc.addPage('landscape');
      footerY = 15;
    }
    
    // Summary section
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Inventory Summary", margin, footerY);
    
    footerY += 6;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    // Summary points in compact format
    const summaryPoints = [
      `• Total Products: ${report.totalProducts.toLocaleString()}`,
      `• Total Stock Value: ${formatRupiah(report.totalStockValue)}`,
      `• Avg Turnover Rate: ${report.avgStockTurnover.toFixed(2)}`,
      `• Out of Stock: ${report.alerts.outOfStockCount}`,
      `• Low Stock: ${report.alerts.lowStockCount}`,
      `• Excess Stock: ${report.alerts.excessStockCount}`,
      `• Items Needing Reorder: ${report.alerts.reorderItemCount}`
    ];
    
    // Split into 3 columns to save space
    const colWidth = Math.floor(summaryPoints.length / 3) + 1;
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
    
    // Footer with page number
    const totalPages = doc.internal.pages.length;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text(
        `${report.name} - ${report.period} | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    }
    
    doc.save(`${report.name}-${report.period}.pdf`);
  };

  // Filter products based on selected filter
  const filteredProducts = () => {
    switch (stockFilter) {
      case 'low':
        return report.products.filter(p => p.stok <= p.minimumStok && p.stok > 0);
      case 'out':
        return report.products.filter(p => p.stok === 0);
      case 'excess':
        return report.products.filter(p => p.stok > p.minimumStok * 3);
      case 'reorder':
        return report.products.filter(p => p.reorderRecommended);
      default:
        return report.products;
    }
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
              width: '20px',
              height: '20px'
            }}
          />
        ))}
      </div>
      
      {/* Download buttons */}
      <div className="flex justify-end mb-4 gap-2">
        <button
          onClick={handleDownloadExcel}
          className="px-4 py-2 bg-[#4DB6AC] font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
          title="Download Excel"
        >
          <FileText size={20} />
          EXCEL
        </button>
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-[#FF8A65] font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2 text-white"
          title="Download PDF"
        >
          <FileDown size={20} />
          PDF
        </button>
      </div>
      
      {/* Tab navigation - Neo-Brutalist Style */}
      <div className="flex border-b-4 border-black mb-6">
        <button
          className={`px-6 py-3 mr-2 font-black text-lg transform ${activeTab === 'overview' ? 'bg-black text-white -rotate-2' : 'bg-white rotate-1'} border-4 border-black transition-all`}
          onClick={() => setActiveTab('overview')}
        >
          OVERVIEW
        </button>
        <button
          className={`px-6 py-3 mr-2 font-black text-lg transform ${activeTab === 'inventory' ? 'bg-black text-white -rotate-2' : 'bg-white rotate-1'} border-4 border-black transition-all`}
          onClick={() => setActiveTab('inventory')}
        >
          INVENTORY
        </button>
      </div>
      
      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div>
          {/* Alert cards for inventory issues */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border-4 border-red-500 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle size={24} className="text-red-500" />
                <h3 className="text-xl font-black">Out of Stock</h3>
              </div>
              <p className="text-4xl font-black">{report.alerts.outOfStockCount}</p>
              <p className="text-sm mt-2">Products with zero inventory</p>
            </div>
            
            <div className="bg-white border-4 border-orange-500 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
              <div className="flex items-center gap-3 mb-3">
                <TrendingDown size={24} className="text-orange-500" />
                <h3 className="text-xl font-black">Low Stock</h3>
              </div>
              <p className="text-4xl font-black">{report.alerts.lowStockCount}</p>
              <p className="text-sm mt-2">Products below minimum level</p>
            </div>
            
            <div className="bg-white border-4 border-blue-500 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
              <div className="flex items-center gap-3 mb-3">
                <PackageOpen size={24} className="text-blue-500" />
                <h3 className="text-xl font-black">Excess Stock</h3>
              </div>
              <p className="text-4xl font-black">{report.alerts.excessStockCount}</p>
              <p className="text-sm mt-2">Products with high inventory levels</p>
            </div>
            
            <div className="bg-white border-4 border-teal-500 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
              <div className="flex items-center gap-3 mb-3">
                <Truck size={24} className="text-teal-500" />
                <h3 className="text-xl font-black">Need Reorder</h3>
              </div>
              <p className="text-4xl font-black">{report.alerts.reorderItemCount}</p>
              <p className="text-sm mt-2">Est. Value: {formatRupiah(report.alerts.totalReorderValue)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8">
            {/* Stock Value by Category */}
            <div className="relative bg-white border-4 border-black p-6 transition-all duration-300 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-teal-400 rounded-lg blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
              
              <div className="relative transition-all duration-300">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="transform -rotate-2 bg-gradient-to-r from-orange-400 to-teal-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-xl font-black tracking-tighter">INVENTORY VALUE BY CATEGORY</h2>
                  </div>
                </div>
                
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={report.categoryBreakdown}
                      dataKey="stockValue"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      fill="#8884d8"
                      stroke="#000000"
                      strokeWidth={3}
                      label={({ categoryName, stockValuePercentage }) => `${categoryName}: ${stockValuePercentage.toFixed(1)}%`}
                      labelLine={{ stroke: '#000000', strokeWidth: 1 }}
                    >
                      {report.categoryBreakdown.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          className="transition-all duration-300" 
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<StockPieTooltip />} />
                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                      iconType="circle"
                      iconSize={15}
                      formatter={(value, entry, index) => {
                        const { categoryName, stockValuePercentage } = report.categoryBreakdown[index];
                        return (
                          <span style={{ color: '#000000', fontWeight: 'bold' }}>
                            {categoryName} ({stockValuePercentage.toFixed(1)}%)
                          </span>
                        );
                      }}
                      wrapperStyle={{
                        border: '2px solid black',
                        backgroundColor: '#ffffff',
                        padding: '8px',
                        borderRadius: '0px',
                        fontWeight: 'bold'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Summary metrics cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
              <h3 className="text-xl font-black mb-4">Total Stock Value</h3>
              <p className="text-3xl font-black">{formatRupiah(report.totalStockValue)}</p>
              <p className="font-bold mt-2 text-sm">
                Across {report.totalProducts} products
              </p>
            </div>
            
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
              <h3 className="text-xl font-black mb-4">Avg Stock Turnover</h3>
              <p className="text-3xl font-black">{report.avgStockTurnover.toFixed(2)}</p>
              <p className="font-bold mt-2 text-sm">
                {report.avgStockTurnover > 6 ? "Healthy turnover" : "Slow-moving inventory"}
              </p>
            </div>
            
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
              <h3 className="text-xl font-black mb-4">Stock:Product Ratio</h3>
              <p className="text-3xl font-black">{report.stockProductRatio.toFixed(2)}</p>
              <p className="font-bold mt-2 text-sm">
                Average units per product
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Inventory tab */}
      {activeTab === 'inventory' && (
        <div>
          {/* Filter controls */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              className={`px-3 py-2 font-bold border-2 border-black ${stockFilter === 'all' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
              onClick={() => setStockFilter('all')}
            >
              All Items
            </button>
            <button
              className={`px-3 py-2 font-bold border-2 border-black ${stockFilter === 'low' ? 'bg-orange-500 text-white' : 'bg-white hover:bg-orange-100'}`}
              onClick={() => setStockFilter('low')}
            >
              <span className="flex items-center gap-1">
                <TrendingDown size={16} />
                Low Stock ({report.alerts.lowStockCount})
              </span>
            </button>
            <button
              className={`px-3 py-2 font-bold border-2 border-black ${stockFilter === 'out' ? 'bg-red-500 text-white' : 'bg-white hover:bg-red-100'}`}
              onClick={() => setStockFilter('out')}
            >
              <span className="flex items-center gap-1">
                <AlertTriangle size={16} />
                Out of Stock ({report.alerts.outOfStockCount})
              </span>
            </button>
            <button
              className={`px-3 py-2 font-bold border-2 border-black ${stockFilter === 'excess' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-blue-100'}`}
              onClick={() => setStockFilter('excess')}
            >
              <span className="flex items-center gap-1">
                <PackageOpen size={16} />
                Excess Stock ({report.alerts.excessStockCount})
              </span>
            </button>
            <button
              className={`px-3 py-2 font-bold border-2 border-black ${stockFilter === 'reorder' ? 'bg-teal-500 text-white' : 'bg-white hover:bg-teal-100'}`}
              onClick={() => setStockFilter('reorder')}
            >
              <span className="flex items-center gap-1">
                <Truck size={16} />
                Need Reorder ({report.alerts.reorderItemCount})
              </span>
            </button>
          </div>

          {/* Inventory table */}
          <div className="overflow-x-auto bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-[500px] overflow-y-scroll">
            <table className="min-w-full bg-white">
              <thead className="bg-black text-white">
                <tr>
                  <th className="py-3 px-4 text-left">Product</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Stock</th>
                  <th className="py-3 px-4 text-right">Min Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Stock Value</th>
                  <th className="py-3 px-4 text-right">Sales Velocity</th>
                  <th className="py-3 px-4 text-right">Days On Hand</th>
                  <th className="py-3 px-4 text-right">Turnover Rate</th>
                  <th className="py-3 px-4 text-center">Reorder</th>
                  <th className="py-3 px-4 text-right">Reorder Qty</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts().map((product) => (
                  <tr key={product.produkId} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 border-r border-gray-200 font-bold">{product.productName}</td>
                    <td className="py-2 px-4 border-r border-gray-200">{product.category}</td>
                    <td className="py-2 px-4 text-right border-r border-gray-200">{formatRupiah(product.hargaModal)}</td>
                    <td className="py-2 px-4 text-right border-r border-gray-200 font-bold">{product.stok}</td>
                    <td className="py-2 px-4 text-right border-r border-gray-200">{product.minimumStok}</td>
                    <td className="py-2 px-4 text-center border-r border-gray-200">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${getStockStatusClass(product.statusStok, product.stok, product.minimumStok)}`}>
                        {product.stok === 0 ? "OUT OF STOCK" : 
                         product.stok <= product.minimumStok ? "LOW STOCK" :
                         product.stok > product.minimumStok * 3 ? "EXCESS" : "NORMAL"}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right border-r border-gray-200">{formatRupiah(product.stockValue)}</td>
                    <td className="py-2 px-4 text-right border-r border-gray-200">{product.salesVelocity.toFixed(1)} units/day</td>
                    <td className="py-2 px-4 text-right border-r border-gray-200">
                      <span className={
                        product.daysOnHand < 7 ? "text-red-600 font-bold" :
                        product.daysOnHand < 14 ? "text-orange-600 font-bold" :
                        product.daysOnHand > 90 ? "text-blue-600 font-bold" : ""
                      }>
                        {Math.round(product.daysOnHand)}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right border-r border-gray-200">{product.stockTurnoverRate.toFixed(2)}</td>
                    <td className="py-2 px-4 text-center border-r border-gray-200">
                      {product.reorderRecommended && (
                        <span className="inline-block px-2 py-1 bg-teal-100 text-teal-800 border border-teal-200 rounded text-xs font-bold">
                          REORDER NOW
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-right">
                      {product.reorderQuantity || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryStockDashboard;