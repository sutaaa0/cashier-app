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
import { useRouter } from "next/navigation";

interface Produk extends PrismaProduk {
  kategori: { nama: string; kategoriId: number };
  image: string;
  promotions?: (Promotion & { categories?: { kategoriId?: number }[] })[];

}

const Pos = () => {
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Menu");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Produk[]>([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const router = useRouter();
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
    keuntungan: 0,
    total_modal: 0,
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
      console.log("ini produk dari pos :", data)
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


  // Tambahkan fungsi helper di dalam komponen Pos
const getPromotionDetails = (
  item: DetailPenjualan & { produk: Produk }
): string | null => {
  if (!item.produk.promotionProducts || item.produk.promotionProducts.length === 0) return null;
  
  const now = new Date();
  const currentDay = now.getDay();
  const isWeekend = currentDay === 0 || currentDay === 6;
  let highestDiscount = 0;
  let bestPromo: Promotion | null = null;

  console.log("item.produk.promotionProducts", item.produk.promotionProducts)

  item.produk.promotionProducts.forEach((pp) => {
    const promo = pp.promotion;
    const isActive =
      now >= new Date(promo.startDate) &&
      now <= new Date(promo.endDate) &&
      (!pp.activeUntil || now <= new Date(pp.activeUntil));
    if (!isActive) return;
    let applies = false;
    switch (promo.type) {
      case "QUANTITY_BASED":
        applies = promo.minQuantity && item.kuantitas >= promo.minQuantity;
        break;
      case "WEEKEND":
        applies = isWeekend;
        break;
      case "FLASH_SALE":
      case "SPECIAL_DAY":
      case "PRODUCT_SPECIFIC":
        applies = true;
        break;
      default:
        applies = false;
    }
    if (!applies) return;
    let discountAmount = 0;
    if (promo.discountPercentage) {
      discountAmount = (item.subtotal * promo.discountPercentage) / 100;
    } else if (promo.discountAmount) {
      discountAmount = promo.discountAmount;
    }
    if (discountAmount > highestDiscount) {
      highestDiscount = discountAmount;
      bestPromo = promo;
    }
  });

  if (!bestPromo) return null;

  // Format detail promosi berdasarkan tipe
  if (bestPromo.type === "QUANTITY_BASED") {
    if (bestPromo.discountPercentage) {
      return `${bestPromo.discountPercentage}% off min. ${bestPromo.minQuantity} pcs`;
    } else if (bestPromo.discountAmount) {
      return `Rp${bestPromo.discountAmount} off min. ${bestPromo.minQuantity} pcs`;
    }
  } else if (bestPromo.type === "WEEKEND") {
    if (bestPromo.discountPercentage) {
      return `Weekend: ${bestPromo.discountPercentage}% off`;
    } else if (bestPromo.discountAmount) {
      return `Weekend: Rp${bestPromo.discountAmount} off`;
    }
  } else if (bestPromo.type === "FLASH_SALE") {
    if (bestPromo.discountPercentage) {
      return `Flash Sale: ${bestPromo.discountPercentage}% off`;
    } else if (bestPromo.discountAmount) {
      return `Flash Sale: Rp${bestPromo.discountAmount} off`;
    }
  } else if (bestPromo.type === "SPECIAL_DAY") {
    if (bestPromo.discountPercentage) {
      return `Special Offer: ${bestPromo.discountPercentage}% off`;
    } else if (bestPromo.discountAmount) {
      return `Special Offer: Rp${bestPromo.discountAmount} off`;
    }
  } else if (bestPromo.type === "PRODUCT_SPECIFIC") {
    if (bestPromo.discountPercentage) {
      return `${bestPromo.title || "Promo"}: ${bestPromo.discountPercentage}% off`;
    } else if (bestPromo.discountAmount) {
      return `${bestPromo.title || "Promo"}: Rp${bestPromo.discountAmount} off`;
    }
  }
  return null;
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
  
      // Calculate total_harga and total_modal
      const total_harga = newDetailPenjualan.reduce((sum, item) => sum + item.subtotal, 0);
      const total_modal = newDetailPenjualan.reduce((sum, item) => sum + (item.produk.hargaModal * item.kuantitas), 0);
      const keuntungan = total_harga - total_modal;
  
      return {
        ...prev,
        detailPenjualan: newDetailPenjualan,
        total_harga,
        total_modal,
        keuntungan,
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
            subtotal: newQuantity * item.produk.harga,
          };
        }
        return item;
      });
  
      // Recalculate totals
      const total_harga = updatedDetailPenjualan.reduce((sum, item) => sum + item.subtotal, 0);
      const total_modal = updatedDetailPenjualan.reduce((sum, item) => sum + (item.produk.hargaModal * item.kuantitas), 0);
      const keuntungan = total_harga - total_modal;
  
      return {
        ...prevOrder,
        detailPenjualan: updatedDetailPenjualan,
        total_harga,
        total_modal,
        keuntungan,
      };
    });
  };

  const handleDeleteItem = (produkId: number) => {
    setOrder((prevOrder) => {
      const updatedDetailPenjualan = prevOrder.detailPenjualan.filter((item) => item.produkId !== produkId);

      // Recalculate totals
      const total_harga = updatedDetailPenjualan.reduce((sum, item) => sum + item.subtotal, 0);
      const total_modal = updatedDetailPenjualan.reduce((sum, item) => sum + (item.produk.hargaModal * item.kuantitas), 0);
      const keuntungan = total_harga - total_modal;

      return {
        ...prevOrder,
        detailPenjualan: updatedDetailPenjualan,
        total_harga,
        total_modal,
        keuntungan,
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
      
      // Make sure to include the total_modal and keuntungan in the order payload
      const orderPayload = {
        ...orderData,
        pelangganId: orderData.pelangganId ?? undefined,
        guestId: orderData.guestId ?? undefined,
        total_harga: orderData.total_harga,
        total_modal: orderData.total_modal,
        keuntungan: orderData.keuntungan,
        redeemedPoints: orderData.redeemedPoints || 0,
        userId: orderData.userId,
        detailPenjualan: orderData.detailPenjualan.map((item) => ({
          produkId: item.produkId,
          kuantitas: item.kuantitas,
          subtotal: item.subtotal,
        })),
      };
      
      const penjualan = await createOrder(orderPayload);
      console.log("penjualan :", penjualan)
  
      if (penjualan && 'total_harga' in penjualan) {
        const receiptModalData = {
          finalTotal: penjualan.total_harga,
          amountReceived: orderData.uangMasuk || 0,
          change: orderData.kembalian || 0,
          customerId: orderData.pelangganId,
          PenjualanId: penjualan.penjualanId,
          petugasId: orderData.userId,
          customerName: orderData.customerName || "Guest",
          orderItems: orderData.detailPenjualan.map((item) => {
            const hargaNormal = item.produk.harga;
            let discountPerUnit = 0;
            
            // Jika produk memiliki promosi aktif, periksa apakah ada discountPercentage atau discountAmount
            if (item.produk.promotionProducts && item.produk.promotionProducts.length > 0) {
              const now = new Date();
              // Filter promosi yang aktif berdasarkan tanggal
              const activePromos = item.produk.promotionProducts.filter((pp) => {
                const promo = pp.promotion;
                return now >= new Date(promo.startDate) && now <= new Date(promo.endDate);
              });
              if (activePromos.length > 0) {
                // Misalnya, ambil promosi dengan diskon tertinggi (atau bisa disesuaikan logikanya)
                let bestPromo = activePromos[0].promotion;
                activePromos.forEach((pp) => {
                  const promo = pp.promotion;
                  let promoDiscount = 0;
                  if (promo.discountPercentage) {
                    promoDiscount = hargaNormal * (promo.discountPercentage / 100);
                  } else if (promo.discountAmount) {
                    promoDiscount = promo.discountAmount;
                  }
                  if (promoDiscount > discountPerUnit) {
                    discountPerUnit = promoDiscount;
                    bestPromo = promo;
                  }
                });
              }
            }
            
            // Total diskon untuk item (berdasarkan kuantitas)
            const discountAmount = discountPerUnit * item.kuantitas;
            // Harga per unit setelah diskon
            const hargaSetelahDiskon = hargaNormal - discountPerUnit;
            
            return {
              nama: item.produk.nama,
              kuantitas: item.kuantitas,
              subtotal: item.subtotal,
              hargaNormal,
              hargaSetelahDiskon,
              discountAmount,
              // Optional: sertakan persentase diskon jika ada
              discountPercentage: discountPerUnit > 0 ? (discountPerUnit / hargaNormal) * 100 : 0,
              // Misalnya, ambil detail promosi sebagai teks (bisa menggunakan helper getPromotionDetails)
              promotionDetails: getPromotionDetails(item),
            };
          }),
          transactionDate: new Date(),
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
          keuntungan: 0,
          total_modal: 0,
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
          onClick={() => router.push("/kasir/return")}
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