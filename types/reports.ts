// @/types/reports.ts
// File ini berisi tipe data untuk semua jenis laporan

// Tipe dasar untuk laporan yang sudah ada
export interface ReportData {
    id: number;
    name: string;
    period: string;
    type: "sales" | "inventory" | "customers" | "product-performance" | "category-performance" | "promotion-analysis" | "customer-loyalty" | "cashier-performance" | "refund-analysis";
    generatedDate: string;
    summary: string;
    data: Record<string, unknown>[];
  }
  
  // Tipe untuk laporan laba
  export interface ProfitReportData {
    id: number;
    name: string;
    period: string;
    periodType: "weekly" | "monthly" | "yearly";
    generatedDate: string;
    totalAmount: number;
    totalProfit: number;
    profitMargin: number;
    data: ProfitPeriodData[];
  }
  
  export interface ProfitPeriodData {
    periodDate: string;
    periodLabel: string;
    totalSales: number;
    totalModal: number;
    profit: number;
    profitMargin: number;
    totalOrders: number;
  }
  
  // Tipe untuk laporan performa produk
  export interface ProductPerformanceData {
    id: number;
    name: string;
    period: string;
    generatedDate: string;
    summary: string;
    data: ProductPerformanceItem[];
  }
  
  export interface ProductPerformanceItem {
    produkId: number;
    nama: string;
    kategori: string;
    totalTerjual: number;
    totalPendapatan: number;
    totalModal: number;
    keuntungan: number;
    marginKeuntungan: number;
    persentasePenjualan: number;
    rataRataPerHari: number;
    jumlahRefund: number;
    persentaseRefund: number;
  }
  
  // Tipe untuk laporan performa kategori
  export interface CategoryPerformanceData {
    id: number;
    name: string;
    period: string;
    generatedDate: string;
    summary: string;
    data: CategoryPerformanceItem[];
  }
  
  export interface CategoryPerformanceItem {
    kategoriId: number;
    nama: string;
    icon: string;
    totalProduk: number;
    totalTerjual: number;
    totalPendapatan: number;
    totalModal: number;
    keuntungan: number;
    marginKeuntungan: number;
    persentasePenjualan: number;
    jumlahRefund: number;
  }
  
  // Tipe untuk laporan analisis promosi
  export interface PromotionAnalysisData {
    id: number;
    name: string;
    period: string;
    generatedDate: string;
    summary: string;
    data: PromotionAnalysisItem[];
  }
  
  export interface PromotionAnalysisItem {
    promotionId: number;
    title: string;
    type: string;
    startDate: string;
    endDate: string;
    discountPercentage: number | null;
    discountAmount: number | null;
    totalProduk: number;
    penjualanSebelum: number;
    penjualanSelama: number;
    peningkatanPenjualan: number;
    persentasePeningkatan: number;
    totalDiskon: number;
    roi: number;
  }
  
  // Tipe untuk laporan loyalitas pelanggan
  export interface CustomerLoyaltyData {
    id: number;
    name: string;
    period: string;
    generatedDate: string;
    summary: string;
    data: CustomerLoyaltyItem[];
  }
  
  export interface CustomerLoyaltyItem {
    pelangganId: number;
    nama: string;
    jumlahTransaksi: number;
    totalPembelian: number;
    rataRataPembelian: number;
    pointsDiperoleh: number;
    pointsDigunakan: number;
    lastPurchaseDate: string;
    daysSinceLastPurchase: number;
    frekuensiKunjungan: number; // rata-rata hari antar kunjungan
  }
  
  // Tipe untuk laporan performa kasir
  export interface CashierPerformanceData {
    id: number;
    name: string;
    period: string;
    generatedDate: string;
    summary: string;
    data: CashierPerformanceItem[];
  }
  
  export interface CashierPerformanceItem {
    userId: number;
    username: string;
    level: string;
    totalTransaksi: number;
    totalPenjualan: number;
    rataRataPerTransaksi: number;
    totalKeuntungan: number;
    marginKeuntungan: number;
    totalRefund: number;
    persentaseRefund: number;
  }
  
  // Tipe untuk laporan analisis refund
  export interface RefundAnalysisData {
    id: number;
    name: string;
    period: string;
    generatedDate: string;
    summary: string;
    data: RefundAnalysisItem[];
    trendData: RefundTrendItem[];
    productData: RefundProductItem[];
  }
  
  export interface RefundAnalysisItem {
    refundId: number;
    tanggalRefund: string;
    totalRefund: number;
    persentaseDariPenjualan: number;
    jumlahProduk: number;
    userId: number;
    username: string;
  }
  
  export interface RefundTrendItem {
    periode: string;
    jumlahRefund: number;
    totalRefund: number;
    persentaseDariPenjualan: number;
  }
  
  export interface RefundProductItem {
    produkId: number;
    nama: string;
    kategori: string;
    jumlahRefund: number;
    totalRefund: number;
    persentaseDariTotalRefund: number;
  }