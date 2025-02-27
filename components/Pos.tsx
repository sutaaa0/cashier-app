"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/header";
import { CategoryNav } from "@/components/category-nav";
import { ProductGrid } from "@/components/product-grid";
import { toast } from "@/hooks/use-toast";
import { createOrder, getProducts } from "@/server/actions";
import { Produk as PrismaProduk, Penjualan, DetailPenjualan, Promotion } from "@prisma/client";
import { NeoSearchInput } from "./InputSearch";
import { NeoOrderSummary } from "./order-summary";
import { NeoProgressIndicator } from "./NeoProgresIndicator";
import { ReceiptModal } from "./ReceiptModal";
import { NeoRefundInput } from "./NeoRefundInput";
import { Button } from "./ui/button";

interface Produk extends PrismaProduk {
  kategori: { nama: string };
  image: string;
  promotions?: Promotion[]
}

const Pos = () => {
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Menu");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Produk[]>([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  interface ReceiptModalData {
    PenjualanId: number | undefined;
    finalTotal: number;
    amountReceived: number;
    change: number;
    customerId: number | null;
    petugasId: number;
    customerName: string;
    orderItems: { nama: string; kuantitas: number; subtotal: number }[];
    transactionDate: Date;
  }

  const [receiptModalData, setReceiptModalData] = useState<ReceiptModalData | null>(null);

  const handleRefundComplete = () => {
    setShowRefundModal(false);
    // Refresh halaman atau reset data jika diperlukan
  };

  const [order, setOrder] = useState<
    Penjualan & {
      detailPenjualan: (DetailPenjualan & { produk: Produk })[];
    }
  >({
    penjualanId: 0,
    tanggalPenjualan: new Date(),
    total_harga: 0,
    pelangganId: null,
    guestId: null,
    userId: 0,
    uangMasuk: 0,
    kembalian: 0,
    detailPenjualan: [],
  });

  console.log("order :", order)

  const orderSummaryRef = useRef<{ resetCustomerData: () => void } | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await getProducts(selectedCategory);
      console.log("ini produk dari pos :",data)
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Gagal mengambil data produk",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToOrder = (product: Produk) => {
    console.log("produk yang di tambahkan ke order :", product)
    setOrder((prev) => {
      const existingItem = prev.detailPenjualan.find((item) => item.produkId === product.produkId);
  
      let newDetailPenjualan: (DetailPenjualan & { produk: Produk })[];
      if (existingItem) {
        newDetailPenjualan = prev.detailPenjualan.map((item) =>
          item.produkId === product.produkId
            ? {
                ...item,
                kuantitas: item.kuantitas + 1,
                subtotal: (item.kuantitas + 1) * product.harga, 
              }
            : item
        );
      } else {
        newDetailPenjualan = [
          ...prev.detailPenjualan,
          {
            detailId: 0,
            penjualanId: prev.penjualanId,
            produkId: product.produkId,
            kuantitas: 1,
            subtotal: product.harga, 
            produk: product,
          },
        ];
      }
  
      const total_harga = newDetailPenjualan.reduce((sum, item) => sum + item.subtotal, 0);
  
      return {
        ...prev,
        detailPenjualan: newDetailPenjualan,
        total_harga,
      };
    });
  };

  const handleUpdateQuantity = (produkId: number, newQuantity: number) => {
    setOrder((prevOrder) => {
      const updatedDetailPenjualan = prevOrder.detailPenjualan.map((item) => {
        if (item.produkId === produkId) {
          return {
            ...item,
            kuantitas: newQuantity,
            subtotal: newQuantity * item.produk.harga, // 👈 Gunakan hargaDiskon
          };
        }
        return item;
      });
  
      const newTotal = updatedDetailPenjualan.reduce((sum, item) => sum + item.subtotal, 0);
  
      return {
        ...prevOrder,
        detailPenjualan: updatedDetailPenjualan,
        total_harga: newTotal,
      };
    });
  };

  const handleDeleteItem = (produkId: number) => {
    setOrder((prevOrder) => {
      const updatedDetailPenjualan = prevOrder.detailPenjualan.filter((item) => item.produkId !== produkId);

      const newTotal = updatedDetailPenjualan.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        ...prevOrder,
        detailPenjualan: updatedDetailPenjualan,
        total_harga: newTotal,
      };
    });
  };

  const handlePlaceOrder = async (orderData: Penjualan & { redeemedPoints?: number; uangMasuk?: number; kembalian?: number; customerName?: string; detailPenjualan: (DetailPenjualan & { produk: Produk })[]; }) => {
    if (orderData.detailPenjualan.length === 0) {
      toast({
        title: "Error",
        description: "Silahkan tambahkan produk terlebih dahulu",
        variant: "destructive",
      });
      return;
    }
  
    try {
      setIsLoading(true);
      
      const orderPayload = {
        ...orderData,
        pelangganId: orderData.pelangganId ?? undefined,
        guestId: orderData.guestId ?? undefined,
        total_harga: orderData.total_harga,
        redeemedPoints: orderData.redeemedPoints || 0,
        userId: orderData.userId,
        detailPenjualan: orderData.detailPenjualan.map((item) => ({
          produkId: item.produkId,
          kuantitas: item.kuantitas,
          subtotal: item.subtotal,
        })),
      };
      
      const penjualan = await createOrder(orderPayload);
  
      if (penjualan) {
        const receiptModalData = {
          finalTotal: penjualan.total_harga,
          amountReceived: orderData.uangMasuk || 0,
          change: orderData.kembalian || 0,
          customerId: orderData.pelangganId,
          PenjualanId: penjualan.PenjualanId,
          petugasId: orderData.userId,
          customerName: orderData.customerName || 'Guest',
          orderItems: orderData.detailPenjualan.map(item => ({
            nama: item.produk.nama,
            kuantitas: item.kuantitas,
            subtotal: item.subtotal
          })),
          transactionDate: new Date()
        };

        console.log("data di kirim ke modal :", receiptModalData)
        setReceiptModalData(receiptModalData);
        setShowReceiptModal(true);
        
        setOrder({
          penjualanId: 0,
          tanggalPenjualan: new Date(),
          total_harga: 0,
          pelangganId: null,
          guestId: null,
          userId: orderData.userId,
          detailPenjualan: [],
          uangMasuk: 0,
          kembalian: 0,
        });
      } else {
        throw new Error("Failed to create order");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: "Gagal membuat pesanan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredProducts = products.filter(
    (product) =>
      (product?.nama || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) &&
      (selectedCategory === "All Menu" || product?.kategori?.nama === selectedCategory)
  );

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <CategoryNav selected={selectedCategory} onSelect={setSelectedCategory} />
          <NeoSearchInput onSearch={handleSearch} />
          <div className="flex-1 overflow-auto">
            {isLoading ? <NeoProgressIndicator isLoading={isLoading} /> : <ProductGrid products={filteredProducts} onProductSelect={addToOrder} />}
          </div>
        </div>
        <NeoOrderSummary 
          ref={orderSummaryRef} 
          order={order} 
          onUpdateQuantity={handleUpdateQuantity} 
          onDeleteItem={handleDeleteItem} 
          onPlaceOrder={handlePlaceOrder}
          onEditItem={() => {}}
          isLoading={isLoading}
        />
      </div>
      
      {showReceiptModal && receiptModalData && (
        <ReceiptModal 
          receiptData={receiptModalData} 
          onClose={() => {
            setShowReceiptModal(false);
            if (orderSummaryRef.current) {
              orderSummaryRef.current.resetCustomerData();
            }
          }} 
        />
      )}

            {/* Refund Button */}
            <div className="fixed bottom-4 right-4">
        <Button
          onClick={() => setShowRefundModal(true)}
          className="mb-3 px-4 py-2 bg-red-500 text-white font-bold border-2 border-black hover:bg-black hover:text-red-500"
        >
          Pengembalian
        </Button>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Proses Pengembalian</h2>
            <NeoRefundInput onRefundComplete={handleRefundComplete} />
            <Button
              onClick={() => setShowRefundModal(false)}
              className=""
            >
              Batal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pos;