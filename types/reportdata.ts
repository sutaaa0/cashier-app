// File: @/types/types.ts

// Tipe untuk data Report yang ditingkatkan
export interface EnhancedReportData {
    id: number;
    name: string;
    period: string;
    type: "sales" | "inventory" | "customers";
    generatedDate: string;
    summary: string;
    data: Record<string, unknown>[];
    
    // Data tambahan untuk analisis
    aggregateData?: {
      total: number;
      count: number;
      average: number;
    };
    
    // Data perbandingan dengan periode sebelumnya
    comparisonData?: {
      period: string;
      totalValue: number;
      count: number;
      percentChange: number;
    };
    
    // Kategori untuk laporan
    categories?: {
      name: string;
      count: number;
      total: number;
    }[];
    
    // Top performers 
    topItems?: {
      name: string;
      value: number;
      percentage: number;
    }[];
  }
  
  // Model Pelanggan
  export interface Pelanggan {
    pelangganId: number;
    nama: string;
    alamat?: string;
    nomorTelepon?: string;
    points: number;
    createdAt: Date;
    penjualan: Penjualan[];
  }
  
  // Model Kategori
  export interface Kategori {
    kategoriId: number;
    nama: string;
    icon: string;
    isDeleted: boolean;
  }
  
  // Model Produk
  export interface Produk {
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
    kategori?: Kategori;
  }
  
  // Model User
  export interface User {
    id: number;
    username: string;
    password: string;
    level: string;
  }
  
  // Model DetailPenjualan
  export interface DetailPenjualan {
    detailId: number;
    penjualanId: number;
    produkId: number;
    kuantitas: number;
    subtotal: number;
    produk: Produk;
  }
  
  // Model Penjualan
  export interface Penjualan {
    penjualanId: number;
    tanggalPenjualan: Date;
    total_harga: number;
    total_modal?: number;
    keuntungan?: number;
    kembalian?: number;
    uangMasuk?: number;
    pelangganId?: number;
    guestId?: number;
    userId: number;
    detailPenjualan: DetailPenjualan[];
    pelanggan?: Pelanggan;
    user?: User;
  }
  
  // Model Receipt
  export interface Receipt {
    id: number;
    transactionId: string;
    penjualanId: number;
    customerName: string;
    petugasId: number;
    total: number;
    pdfUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    penjualan: Penjualan;
  }
  
  // Model untuk Refund
  export interface Refund {
    refundId: number;
    penjualanId: number;
    tanggalRefund: Date;
    totalRefund: number;
    userId: number;
    detailRefund: DetailRefund[];
    penjualan: Penjualan;
    user: User;
  }
  
  // Model untuk DetailRefund
  export interface DetailRefund {
    detailRefundId: number;
    refundId: number;
    produkId: number;
    kuantitas: number;
    produk: Produk;
    refund: Refund;
  }
  
  // Enum untuk tipe promosi
  export enum PromotionType {
    FLASH_SALE = "FLASH_SALE",
    SPECIAL_DAY = "SPECIAL_DAY",
    WEEKEND = "WEEKEND",
    PRODUCT_SPECIFIC = "PRODUCT_SPECIFIC",
    QUANTITY_BASED = "QUANTITY_BASED"
  }
  
  // Model untuk Promotion
  export interface Promotion {
    promotionId: number;
    title: string;
    description?: string;
    type: PromotionType;
    startDate: Date;
    endDate: Date;
    discountPercentage?: number;
    discountAmount?: number;
    minQuantity?: number;
    createdAt: Date;
    updatedAt: Date;
    promotionProducts: PromotionProduct[];
  }
  
  // Model untuk PromotionProduct
  export interface PromotionProduct {
    id: number;
    promotionId: number;
    produkId: number;
    activeUntil?: Date;
    promotion: Promotion;
    produk: Produk;
  }