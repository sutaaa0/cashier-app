export interface Product {
    produkId: number;
    nama: string;
    harga: number;
    stok: number;
    kategori: string;
    image: string;
  }
  
  export interface OrderDetail {
    detailId: number;
    penjualanId: number;
    produkId: number;
    kuantitas: number;
    subtotal: number;
    produk: Product;
  }
  
  export interface Order {
    penjualanId: number;
    tanggalPenjualan: Date;
    total_harga: number;
    pelangganId: number;
    detailPenjualan: OrderDetail[];
  }
  export interface CreateOrderDetail {
    penjualanId: number;
    produkId: number;
    kuantitas: number;
    subtotal: number;
  }


  // untuk di report & analisis
export interface Penjualan {
  penjualanId: number;
  tanggalPenjualan: Date;
  total_harga: number;
  detailPenjualan: {
    produk: Produk;
  }[];
}

export interface Produk {
  nama: string;
  harga: number;
  stok: number;
  kategori: string;
  isDeleted: boolean;
}

export interface Pelanggan {
  nama: string;
  points: number;
  nomorTelepon?: string | null;
  penjualan: Penjualan[];
}